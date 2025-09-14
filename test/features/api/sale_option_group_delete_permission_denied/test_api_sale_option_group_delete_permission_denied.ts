import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";

/**
 * Test deletion of a sale option group for permission denied scenarios.
 *
 * 1. Attempt to delete a sale option group without any authentication
 *    (anonymous).
 *
 *    - Expect an error indicating permission denied.
 * 2. Join (register) a new admin user via /auth/adminUser/join.
 *
 *    - This sets up an authenticated context.
 * 3. Attempt to delete a sale option group with this admin user but assume
 *    insufficient permission.
 *
 *    - Expect an error indicating permission denied.
 * 4. Use TestValidator.error to check that the delete operation fails with the
 *    expected error.
 */
export async function test_api_sale_option_group_delete_permission_denied(
  connection: api.IConnection,
) {
  // 1. Attempt delete without authentication
  const randomUuid = typia.random<string & tags.Format<"uuid">>();
  await TestValidator.error(
    "delete sale option group denied without authentication",
    async () => {
      await api.functional.shoppingMall.adminUser.saleOptionGroups.erase(
        connection,
        { saleOptionGroupId: randomUuid },
      );
    },
  );

  // 2. Join a new admin user (to have authentication)
  const adminUser = await api.functional.auth.adminUser.join(connection, {
    body: {
      email: `admin_${RandomGenerator.alphaNumeric(8)}@example.com`,
      password_hash: RandomGenerator.alphaNumeric(16),
      nickname: RandomGenerator.name(),
      full_name: RandomGenerator.name(),
      status: "active",
    } satisfies IShoppingMallAdminUser.ICreate,
  });
  typia.assert(adminUser);

  // 3. Attempt delete with authenticated user but assumed insufficient permissions
  // For this test, assume the newly joined admin user lacks delete permission
  const anotherRandomUuid = typia.random<string & tags.Format<"uuid">>();
  await TestValidator.error(
    "delete sale option group denied due to insufficient permissions",
    async () => {
      await api.functional.shoppingMall.adminUser.saleOptionGroups.erase(
        connection,
        { saleOptionGroupId: anotherRandomUuid },
      );
    },
  );
}
