import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";

/**
 * Test the Admin User login operation to validate successful authentication
 * with a valid email and password, and verify failure scenarios including
 * invalid credentials, inactive users, and banned accounts. Upon success,
 * ensure the response includes a JWT token with access, refresh, expiration
 * fields, and proper user information. The test covers secure login
 * functionality for admin users and handles appropriate error responses
 * from invalid login attempts. Initial setup includes creating an admin
 * user via the join API. The test will iterate through invalid credential
 * attempts, invalid password, wrong email, and inactive status user cases,
 * verifying that errors are thrown. Finally, a successful login with
 * correct credentials results in a validated authorized admin user
 * response.
 */
export async function test_api_adminuser_login_success_and_failure(
  connection: api.IConnection,
) {
  // Step 1: Create a new admin user using the join endpoint with realistic data
  const email = typia.random<string & tags.Format<"email">>();
  const passwordHash = RandomGenerator.alphaNumeric(64);
  const nickname = RandomGenerator.name(2);
  const fullName = RandomGenerator.name(2);
  const createBody = {
    email: email,
    password_hash: passwordHash,
    nickname: nickname,
    full_name: fullName,
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const createdAdmin = await api.functional.auth.adminUser.join(connection, {
    body: createBody,
  });
  typia.assert(createdAdmin);
  TestValidator.equals(
    "created admin user email matches input",
    createdAdmin.email,
    email,
  );
  TestValidator.equals(
    "created admin user nickname matches input",
    createdAdmin.nickname,
    nickname,
  );
  TestValidator.equals(
    "created admin user full_name matches input",
    createdAdmin.full_name,
    fullName,
  );
  TestValidator.equals(
    "created admin user status is active",
    createdAdmin.status,
    "active",
  );

  // Step 2: Define invalid login attempts to test failure cases
  // 2.1 Incorrect password
  const invalidPasswordBody = {
    email: email,
    password_hash: RandomGenerator.alphaNumeric(64),
  } satisfies IShoppingMallAdminUser.ILogin;
  await TestValidator.error("login fails with wrong password", async () => {
    await api.functional.auth.adminUser.login(connection, {
      body: invalidPasswordBody,
    });
  });

  // 2.2 Incorrect email (simulate email not registered)
  const invalidEmailBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: passwordHash,
  } satisfies IShoppingMallAdminUser.ILogin;
  await TestValidator.error("login fails with wrong email", async () => {
    await api.functional.auth.adminUser.login(connection, {
      body: invalidEmailBody,
    });
  });

  // 2.3 Inactive user login (create a user with status 'inactive')
  const inactiveEmail = typia.random<string & tags.Format<"email">>();
  const inactiveCreateBody = {
    email: inactiveEmail,
    password_hash: passwordHash,
    nickname: RandomGenerator.name(2),
    full_name: RandomGenerator.name(2),
    status: "inactive",
  } satisfies IShoppingMallAdminUser.ICreate;
  const inactiveUser = await api.functional.auth.adminUser.join(connection, {
    body: inactiveCreateBody,
  });
  typia.assert(inactiveUser);

  const inactiveLoginBody = {
    email: inactiveEmail,
    password_hash: passwordHash,
  } satisfies IShoppingMallAdminUser.ILogin;
  await TestValidator.error("login fails for inactive user", async () => {
    await api.functional.auth.adminUser.login(connection, {
      body: inactiveLoginBody,
    });
  });

  // 2.4 Banned user scenario (status 'banned')
  const bannedEmail = typia.random<string & tags.Format<"email">>();
  const bannedCreateBody = {
    email: bannedEmail,
    password_hash: passwordHash,
    nickname: RandomGenerator.name(2),
    full_name: RandomGenerator.name(2),
    status: "banned",
  } satisfies IShoppingMallAdminUser.ICreate;
  const bannedUser = await api.functional.auth.adminUser.join(connection, {
    body: bannedCreateBody,
  });
  typia.assert(bannedUser);

  const bannedLoginBody = {
    email: bannedEmail,
    password_hash: passwordHash,
  } satisfies IShoppingMallAdminUser.ILogin;
  await TestValidator.error("login fails for banned user", async () => {
    await api.functional.auth.adminUser.login(connection, {
      body: bannedLoginBody,
    });
  });

  // Step 3: Successful login with correct credentials
  const validLoginBody = {
    email: email,
    password_hash: passwordHash,
  } satisfies IShoppingMallAdminUser.ILogin;
  const loginResult = await api.functional.auth.adminUser.login(connection, {
    body: validLoginBody,
  });
  typia.assert(loginResult);

  TestValidator.equals(
    "logged in user email matches",
    loginResult.email,
    email,
  );
  TestValidator.equals(
    "logged in user nickname matches",
    loginResult.nickname,
    nickname,
  );
  TestValidator.equals(
    "logged in user full_name matches",
    loginResult.full_name,
    fullName,
  );
  TestValidator.equals(
    "logged in user status is active",
    loginResult.status,
    "active",
  );

  TestValidator.predicate(
    "token access is a non-empty string",
    typeof loginResult.token.access === "string" &&
      loginResult.token.access.length > 0,
  );
  TestValidator.predicate(
    "token refresh is a non-empty string",
    typeof loginResult.token.refresh === "string" &&
      loginResult.token.refresh.length > 0,
  );

  TestValidator.predicate(
    "token expired_at is ISO 8601 string",
    typeof loginResult.token.expired_at === "string" &&
      !isNaN(Date.parse(loginResult.token.expired_at)),
  );

  TestValidator.predicate(
    "token refreshable_until is ISO 8601 string",
    typeof loginResult.token.refreshable_until === "string" &&
      !isNaN(Date.parse(loginResult.token.refreshable_until)),
  );
}
