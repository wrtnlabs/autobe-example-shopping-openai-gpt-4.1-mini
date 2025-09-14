import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";

/**
 * This test validates the deletion of sale option groups by an admin user.
 *
 * It covers successful deletion, error scenarios when deleting non-existent
 * sale option group IDs, and authorization via join endpoint.
 *
 * Workflow:
 *
 * 1. Admin user creation and authentication via /auth/adminUser/join.
 * 2. Attempt deletion of a valid sale option group ID and expect no error.
 * 3. Attempt deletion of a non-existent random UUID and expect error.
 *
 * Tests ensure proper authorization precedence and error handling.
 */
export async function test_api_sale_option_group_delete_success_and_failure(
  connection: api.IConnection,
) {
  // 1. Admin user creation and authentication
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: typia.random<string & tags.Format<"email">>(),
        password_hash: RandomGenerator.alphaNumeric(10),
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(2),
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // 2. Successful deletion with a valid but random UUID (simulate existing id)
  const validSaleOptionGroupId = typia.random<string & tags.Format<"uuid">>();
  await api.functional.shoppingMall.adminUser.saleOptionGroups.erase(
    connection,
    { saleOptionGroupId: validSaleOptionGroupId },
  );

  // 3. Deletion attempt of a non-existent sale option group id - expect error
  const nonExistentId = typia.random<string & tags.Format<"uuid">>();
  await TestValidator.error(
    "delete non-existent sale option group ID should throw",
    async () => {
      await api.functional.shoppingMall.adminUser.saleOptionGroups.erase(
        connection,
        { saleOptionGroupId: nonExistentId },
      );
    },
  );
}
