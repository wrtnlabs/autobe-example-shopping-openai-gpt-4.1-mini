import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";

/**
 * Successfully retrieve detailed information of a specific administrator
 * user by ID.
 *
 * This test function performs a complete workflow:
 *
 * 1. Create a new admin user by joining with valid credentials.
 * 2. Login as the created admin user to obtain authorization.
 * 3. Retrieve detailed information of the admin user by their ID.
 * 4. Validate that the retrieved data accurately matches the created and
 *    logged-in user data.
 *
 * The test ensures that the admin user creation and authentication flows
 * work correctly, and that admin user details can be fetched securely and
 * precisely. It also validates date-time formats for timestamps.
 *
 * This confirms the integrity of admin user management APIs under normal
 * operational conditions. The test assumes authorization tokens are
 * automatically handled by the SDK layer.
 */
export async function test_api_admin_user_detail_retrieval_success(
  connection: api.IConnection,
) {
  // 1. Create admin user account with join
  const joinBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(64),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const joinedUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: joinBody,
    });
  typia.assert(joinedUser);

  // 2. Login using the same email and password_hash
  const loginBody = {
    email: joinBody.email,
    password_hash: joinBody.password_hash,
  } satisfies IShoppingMallAdminUser.ILogin;

  const loggedInUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.login(connection, {
      body: loginBody,
    });
  typia.assert(loggedInUser);

  // 3. Retrieve admin user details by id
  const adminUser: IShoppingMallAdminUser =
    await api.functional.shoppingMall.adminUser.adminUsers.at(connection, {
      id: loggedInUser.id,
    });
  typia.assert(adminUser);

  // 4. Validate key properties match expected values
  TestValidator.equals("admin user ID matches", adminUser.id, loggedInUser.id);
  TestValidator.equals(
    "admin user email matches",
    adminUser.email,
    loggedInUser.email,
  );
  TestValidator.equals(
    "admin user nickname matches",
    adminUser.nickname,
    loggedInUser.nickname,
  );
  TestValidator.equals(
    "admin user full name matches",
    adminUser.full_name,
    loggedInUser.full_name,
  );
  TestValidator.equals(
    "admin user status matches",
    adminUser.status,
    loggedInUser.status,
  );
  TestValidator.predicate(
    "admin user created_at is valid ISO date-time string",
    /^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])T([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]Z$/.test(
      adminUser.created_at,
    ),
  );
  TestValidator.predicate(
    "admin user updated_at is valid ISO date-time string",
    /^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])T([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]Z$/.test(
      adminUser.updated_at,
    ),
  );
  // deleted_at is nullable so if not null check type
  if (adminUser.deleted_at !== null && adminUser.deleted_at !== undefined) {
    TestValidator.predicate(
      "admin user deleted_at is valid ISO date-time string",
      /^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])T([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9]Z$/.test(
        adminUser.deleted_at,
      ),
    );
  }
}
