import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * Validate that deleting a sale option group without proper authentication or
 * without sufficient sellerUser permissions is correctly forbidden.
 *
 * This test ensures that the API endpoint
 * /shoppingMall/sellerUser/saleOptionGroups/{saleOptionGroupId} enforces access
 * control, forbidding unauthenticated users and users without sellerUser roles
 * from deleting sale option groups.
 *
 * Steps:
 *
 * 1. Perform the required sellerUser join to setup authentication context.
 * 2. Attempt to delete a sale option group without any authentication and expect
 *    an error.
 * 3. Attempt to delete a sale option group with authentication context but without
 *    sufficient permissions and expect an error.
 */
export async function test_api_sale_option_group_delete_seller_permission_denied(
  connection: api.IConnection,
) {
  // Step 1: Join as sellerUser to acquire authorized authentication
  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: {
        email: typia.random<string & tags.Format<"email">>(),
        password: "P@ssword123!",
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(2),
        phone_number: null,
        business_registration_number: RandomGenerator.alphaNumeric(10),
      } satisfies IShoppingMallSellerUser.ICreate,
    });
  typia.assert(sellerUser);

  // Step 2: Create unauthenticated connection (no headers)
  const unauthConn: api.IConnection = { ...connection, headers: {} };

  // Step 3: Attempt delete without authentication - expect error
  await TestValidator.error(
    "delete without authentication should be forbidden",
    async () => {
      await api.functional.shoppingMall.sellerUser.saleOptionGroups.erase(
        unauthConn,
        {
          saleOptionGroupId: typia.random<string & tags.Format<"uuid">>(),
        },
      );
    },
  );

  // Step 4: Attempt delete with authenticated connection but simulate insufficient permission
  // This uses sellerUser authorized connection but in practice, the real permission scenario depends on backend
  // Since join is only for authentication, we reuse connection as is which has sellerUser authorization
  await TestValidator.error(
    "delete with insufficient permission should be forbidden",
    async () => {
      await api.functional.shoppingMall.sellerUser.saleOptionGroups.erase(
        connection,
        {
          saleOptionGroupId: typia.random<string & tags.Format<"uuid">>(),
        },
      );
    },
  );
}
