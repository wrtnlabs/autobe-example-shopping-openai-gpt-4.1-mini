import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallSaleOptionGroup } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleOptionGroup";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * Validate update operation of sale option group name by authenticated
 * seller user.
 *
 * This test performs full workflow of creating a seller user,
 * authenticating, then updating an existing sale option group's name to
 * verify access control and update functionality.
 *
 * Steps:
 *
 * 1. Seller user signs up via authentication join endpoint (POST
 *    /auth/sellerUser/join)
 * 2. Prepare a new sale option group with realistic data
 * 3. Update the existing sale option group's name by calling update endpoint
 *    as the authenticated seller user
 * 4. Validate all responses using typia.assert() ensuring data integrity
 *
 * This ensures only authorized seller users can update sale option groups
 * and that the update is correctly persisted.
 */
export async function test_api_sale_option_group_update_valid_seller(
  connection: api.IConnection,
) {
  // 1. Seller user signup and authentication
  const sellerEmail: string = typia.random<string & tags.Format<"email">>();
  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: {
        email: sellerEmail,
        password: "P@ssword123!",
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(2),
        phone_number: null,
        business_registration_number: `${RandomGenerator.alphabets(3).toUpperCase()}${typia.random<string & tags.Pattern<"^[0-9]{9}$">>()}`,
      } satisfies IShoppingMallSellerUser.ICreate,
    });
  typia.assert(sellerUser);

  // 2. Create a new sale option group object with realistic data
  const saleOptionGroupId: string = typia.random<
    string & tags.Format<"uuid">
  >();
  const oldName: string = RandomGenerator.paragraph({
    sentences: 3,
    wordMin: 4,
    wordMax: 8,
  });
  const code: string = RandomGenerator.paragraph({
    sentences: 1,
    wordMin: 3,
    wordMax: 5,
  })
    .replace(/\s/g, "_")
    .toUpperCase();
  // Dates: generate recent ISO 8601 strings
  const createdAt: string = new Date(
    Date.now() - 86400000 * RandomGenerator.pick([1, 2, 3, 4, 5]),
  ).toISOString();
  const updatedAt: string = new Date().toISOString();

  const saleOptionGroup: IShoppingMallSaleOptionGroup = {
    id: saleOptionGroupId,
    code: code,
    name: oldName,
    created_at: createdAt,
    updated_at: updatedAt,
    deleted_at: null,
  };

  typia.assert(saleOptionGroup);

  // 3. Update sale option group name with seller user authorization
  const newName: string = RandomGenerator.paragraph({
    sentences: 2,
    wordMin: 5,
    wordMax: 10,
  });
  const updatedSaleOptionGroup: IShoppingMallSaleOptionGroup =
    await api.functional.shoppingMall.sellerUser.saleOptionGroups.update(
      connection,
      {
        saleOptionGroupId: saleOptionGroup.id,
        body: {
          name: newName,
        } satisfies IShoppingMallSaleOptionGroup.IUpdate,
      },
    );
  typia.assert(updatedSaleOptionGroup);

  // 4. Validate that the updated name matches input
  TestValidator.equals(
    "updated sale option group name should match",
    updatedSaleOptionGroup.name,
    newName,
  );
}
