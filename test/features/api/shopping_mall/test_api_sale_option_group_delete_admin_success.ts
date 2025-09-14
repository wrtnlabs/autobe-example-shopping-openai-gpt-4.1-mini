import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";

/**
 * Test the deletion of a sale option group by an authenticated admin user.
 *
 * This E2E test performs the following steps:
 *
 * 1. Create an admin user to obtain authentication.
 * 2. Attempt to delete a sale option group using a randomized UUID.
 * 3. Confirm no errors occur during deletion operation.
 */
export async function test_api_sale_option_group_delete_admin_success(
  connection: api.IConnection,
) {
  // 1. Create an admin user
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: `${RandomGenerator.alphaNumeric(6)}@example.com`,
        password_hash: RandomGenerator.alphaNumeric(12),
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(2),
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // 2. Generate random UUID for saleOptionGroupId
  const saleOptionGroupId = typia.random<string & tags.Format<"uuid">>();

  // 3. Delete the sale option group by ID
  await api.functional.shoppingMall.adminUser.saleOptionGroups.erase(
    connection,
    {
      saleOptionGroupId,
    },
  );
}
