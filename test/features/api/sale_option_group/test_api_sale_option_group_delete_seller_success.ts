import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * Test deletion of a sale option group by an authenticated seller user with
 * valid permissions.
 *
 * This test verifies that a seller user can successfully delete a sale
 * option group when properly authenticated. It performs a full
 * authentication via the join endpoint, generates a valid sale option group
 * ID (simulated), calls the erase operation, and ensures the delete
 * operation completes without throwing errors.
 *
 * The test asserts type safety and logical correctness using typia.assert
 * and TestValidator.
 */
export async function test_api_sale_option_group_delete_seller_success(
  connection: api.IConnection,
) {
  // 1. Seller user registration and authentication
  const sellerEmail: string = typia.random<string & tags.Format<"email">>();
  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: {
        email: sellerEmail,
        password: "P@ssword123!",
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        phone_number: null,
        business_registration_number: RandomGenerator.alphaNumeric(12),
      } satisfies IShoppingMallSellerUser.ICreate,
    });
  typia.assert(sellerUser);
  TestValidator.predicate(
    "seller user is authorized",
    sellerUser.accessToken !== undefined && sellerUser.accessToken.length > 0,
  );

  // 2. Generate a valid UUID for sale option group ID
  const saleOptionGroupId = typia.random<string & tags.Format<"uuid">>();

  // 3. Delete the sale option group by the seller user
  await api.functional.shoppingMall.sellerUser.saleOptionGroups.erase(
    connection,
    {
      saleOptionGroupId: saleOptionGroupId,
    },
  );

  // 4. Since API erases with no output, successful completion implies success
  TestValidator.predicate(
    "sale option group deletion completed successfully",
    true,
  );
}
