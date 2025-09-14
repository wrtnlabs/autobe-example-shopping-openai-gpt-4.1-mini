import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";

/**
 * Validate that an admin user can successfully delete a sale option group
 * by ID.
 *
 * This test function performs the following sequence:
 *
 * 1. Create a new admin user via the join endpoint to establish
 *    authentication.
 * 2. Use the authenticated context (JWT token) to delete a sale option group
 *    with a valid UUID.
 * 3. Validate that the deletion operation completes without error (void
 *    response).
 *
 * All steps respect the exact DTO type requirements, including proper email
 * format, password hashing, and required admin user properties during
 * join.
 *
 * This test does not attempt to verify post-deletion state due to API
 * limitations.
 */
export async function test_api_sale_option_group_delete_admin_success(
  connection: api.IConnection,
) {
  // 1. Generate admin user creation data with required properties.
  const adminUserBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(64),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  // 2. Create admin user and validate response.
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminUserBody,
    });
  typia.assert(adminUser);

  // 3. Prepare a valid UUID for the sale option group ID to delete.
  const saleOptionGroupId = typia.random<string & tags.Format<"uuid">>();

  // 4. Call the delete API to erase the sale option group.
  await api.functional.shoppingMall.adminUser.saleOptionGroups.erase(
    connection,
    { saleOptionGroupId },
  );
}
