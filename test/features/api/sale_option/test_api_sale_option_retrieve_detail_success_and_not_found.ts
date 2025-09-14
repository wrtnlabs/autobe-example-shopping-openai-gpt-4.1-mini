import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallSaleOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleOption";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * Test for retrieving detailed sale option information and handling not
 * found error.
 *
 * Steps:
 *
 * 1. Create and authenticate a seller user using /auth/sellerUser/join
 *    endpoint.
 * 2. Attempt to retrieve a sale option with an invalid or random saleOptionId.
 * 3. Confirm that retrieval of non-existent saleOptionId triggers an error.
 *
 * Note:
 *
 * - The success case retrieval is not implemented because there is no public
 *   API to create sale options.
 * - This test ensures the error handling path for retrieving sale options
 *   works correctly.
 */
export async function test_api_sale_option_retrieve_detail_success_and_not_found(
  connection: api.IConnection,
) {
  // 1. Create and authenticate seller user
  const sellerUserCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password: "StrongPassword123!",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: null,
    business_registration_number: RandomGenerator.alphaNumeric(10),
  } satisfies IShoppingMallSellerUser.ICreate;
  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: sellerUserCreateBody,
    });
  typia.assert(sellerUser);

  // 2. Attempt retrieval with an invalid (random) saleOptionId expecting error
  const invalidSaleOptionId: string & tags.Format<"uuid"> = typia.random<
    string & tags.Format<"uuid">
  >();
  await TestValidator.error(
    "retrieving non-existent saleOptionId throws error",
    async () => {
      await api.functional.shoppingMall.sellerUser.saleOptions.at(connection, {
        saleOptionId: invalidSaleOptionId,
      });
    },
  );
}
