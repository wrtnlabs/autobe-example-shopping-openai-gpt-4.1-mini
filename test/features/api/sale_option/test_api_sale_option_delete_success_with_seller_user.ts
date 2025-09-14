import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallSaleOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleOption";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * Validates that a seller user can delete a sale option successfully.
 *
 * This test performs the following steps:
 *
 * 1. Registers a seller user and authenticates
 * 2. Creates a new sale option with valid required data
 * 3. Deletes the created sale option using its unique ID
 * 4. Verifies that the sale option is deleted by asserting that subsequent
 *    deletion attempt throws an error
 *
 * The test ensures that only authorized seller users can delete their sale
 * options, and that the deletion is permanent.
 */
export async function test_api_sale_option_delete_success_with_seller_user(
  connection: api.IConnection,
) {
  // 1. Create a seller user and authenticate
  const sellerEmail = typia.random<string & tags.Format<"email">>();
  const seller: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: {
        email: sellerEmail,
        password: "P@ssword123!",
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(2),
        phone_number: null,
        business_registration_number: RandomGenerator.alphaNumeric(10),
      } satisfies IShoppingMallSellerUser.ICreate,
    });
  typia.assert(seller);

  // 2. Create a sale option with valid data
  const saleOptionGroupId = typia.random<string & tags.Format<"uuid">>();
  const createBody = {
    shopping_mall_sale_option_group_id: saleOptionGroupId,
    code: RandomGenerator.alphaNumeric(8),
    name: RandomGenerator.paragraph({ sentences: 3 }),
    type: RandomGenerator.pick(["selection", "boolean", "text"] as const),
  } satisfies IShoppingMallSaleOption.ICreate;

  const saleOption: IShoppingMallSaleOption =
    await api.functional.shoppingMall.sellerUser.saleOptions.create(
      connection,
      {
        body: createBody,
      },
    );
  typia.assert(saleOption);

  // 3. Delete the created sale option by ID
  await api.functional.shoppingMall.sellerUser.saleOptions.erase(connection, {
    saleOptionId: saleOption.id,
  });

  // 4. Verify deletion by attempting to delete again and expecting error
  await TestValidator.error(
    "deleting the same sale option again should fail",
    async () => {
      await api.functional.shoppingMall.sellerUser.saleOptions.erase(
        connection,
        {
          saleOptionId: saleOption.id,
        },
      );
    },
  );
}
