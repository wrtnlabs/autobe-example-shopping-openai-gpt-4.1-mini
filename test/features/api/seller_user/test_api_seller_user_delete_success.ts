import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";

/**
 * Validates the successful deletion of a seller user by an authenticated
 * admin user.
 *
 * This test performs the following steps in sequence:
 *
 * 1. Creates a new admin user account by calling the join API.
 * 2. Logs in as the same admin user, establishing an authentication context.
 * 3. Permanently deletes a seller user identified by a randomly generated
 *    UUID.
 *
 * Each API call's result is asserted for type correctness, ensuring the
 * authentication token and responses meet the expected DTO formats.
 *
 * The test confirms that deletion executes without error, implying correct
 * authorization handling and functionality.
 *
 * @param connection The API connection instance used for all calls.
 */
export async function test_api_seller_user_delete_success(
  connection: api.IConnection,
) {
  // Step 1: Admin user creation (join)
  const adminEmail: string = typia.random<string & tags.Format<"email">>();
  const adminPasswordHash = "securehashedpassword"; // placeholder for password hash

  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: adminEmail,
        password_hash: adminPasswordHash,
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // Step 2: Admin user login (login) with the same credentials
  const adminLogin: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.login(connection, {
      body: {
        email: adminEmail,
        password_hash: adminPasswordHash,
      } satisfies IShoppingMallAdminUser.ILogin,
    });
  typia.assert(adminLogin);

  // Step 3: Delete seller user - generate random UUID to delete
  const sellerUserIdToDelete: string = typia.random<
    string & tags.Format<"uuid">
  >();

  await api.functional.shoppingMall.adminUser.sellerUsers.erase(connection, {
    id: sellerUserIdToDelete,
  });
}
