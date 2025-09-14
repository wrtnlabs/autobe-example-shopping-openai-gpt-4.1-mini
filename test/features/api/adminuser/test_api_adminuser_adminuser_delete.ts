import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";

/**
 * Test deleting an administrator user by ID as an authenticated admin user.
 *
 * This test function performs the full lifecycle of admin user creation,
 * authentication, deletion, and validation of deletion failure. It ensures that
 * an admin user can be created and logged in, then securely deleted by ID.
 * Afterwards, attempts to delete the same admin user again fail with an error,
 * confirming account removal.
 *
 * The SDK automatically manages authentication tokens after join and login
 * steps so the deletion request is properly authorized. This validates both the
 * business function and security enforcement of admin user deletion.
 *
 * Steps:
 *
 * 1. Join a new admin user account with valid realistic data.
 * 2. Login as that admin user to establish authentication context.
 * 3. Delete the admin user by ID.
 * 4. Attempt second deletion which must fail.
 * 5. Validate type safety and error conditions throughout.
 */
export async function test_api_adminuser_adminuser_delete(
  connection: api.IConnection,
) {
  // 1. Create a new admin user (join)
  const createBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(32),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const createdUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, { body: createBody });
  typia.assert(createdUser);

  // 2. Login as the created admin user
  const loginBody = {
    email: createBody.email,
    password_hash: createBody.password_hash,
  } satisfies IShoppingMallAdminUser.ILogin;

  const loggedInUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.login(connection, { body: loginBody });
  typia.assert(loggedInUser);

  // The SDK automatically manages authentication tokens after join/login

  // 3. Delete the admin user by ID
  await api.functional.shoppingMall.adminUser.adminUsers.erase(connection, {
    id: createdUser.id,
  });

  // 4. Attempt to delete the same admin user again which should fail
  await TestValidator.error(
    "delete non-existent admin user should fail",
    async () => {
      await api.functional.shoppingMall.adminUser.adminUsers.erase(connection, {
        id: createdUser.id,
      });
    },
  );
}
