import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";

/**
 * Test Admin User token refresh operation by providing a valid refresh
 * token. Verify new access and refresh tokens are issued with updated
 * expiration timestamps. Also test invalid or expired refresh token
 * scenarios to confirm proper error responses. This ensures continuous
 * authenticated sessions for admins without re-login.
 *
 * Steps:
 *
 * 1. Create admin user using /auth/adminUser/join with valid data.
 * 2. Login the created admin user using /auth/adminUser/login to obtain
 *    initial tokens.
 * 3. Refresh tokens using /auth/adminUser/refresh with valid refresh token.
 *    Verify new tokens and expiration timestamps.
 * 4. Test failure cases with empty and malformed refresh tokens.
 * 5. Use typia.assert to validate responses, await all calls, and assert
 *    failures with TestValidator.
 */
export async function test_api_adminuser_refresh_token_success_and_failure(
  connection: api.IConnection,
) {
  // 1. Create admin user using join API
  const createBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(64),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const authorizedResponse: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: createBody,
    });
  typia.assert(authorizedResponse);

  // 2. Login the created admin user
  const loginBody = {
    email: createBody.email,
    password_hash: createBody.password_hash,
  } satisfies IShoppingMallAdminUser.ILogin;
  const loginResponse: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.login(connection, {
      body: loginBody,
    });
  typia.assert(loginResponse);

  // 3. Refresh tokens with valid refresh token
  const refreshBody = {
    token: loginResponse.token.refresh,
  } satisfies IShoppingMallAdminUser.IRefresh;
  const refreshResponse: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.refresh(connection, {
      body: refreshBody,
    });
  typia.assert(refreshResponse);

  // Validations
  TestValidator.predicate(
    "refreshResponse has new access token",
    refreshResponse.token.access !== loginResponse.token.access,
  );
  TestValidator.predicate(
    "refreshResponse has new refresh token",
    refreshResponse.token.refresh !== loginResponse.token.refresh,
  );
  TestValidator.predicate(
    "refreshResponse token expired_at is later than loginResponse token expired_at",
    new Date(refreshResponse.token.expired_at) >
      new Date(loginResponse.token.expired_at),
  );
  TestValidator.predicate(
    "refreshResponse token refreshable_until is later than loginResponse token refreshable_until",
    new Date(refreshResponse.token.refreshable_until) >
      new Date(loginResponse.token.refreshable_until),
  );

  // 4. Failure cases: empty refresh token
  await TestValidator.error(
    "refresh with empty token should fail",
    async () => {
      const invalidBody = {
        token: "",
      } satisfies IShoppingMallAdminUser.IRefresh;
      await api.functional.auth.adminUser.refresh(connection, {
        body: invalidBody,
      });
    },
  );

  // 5. Failure case: malformed refresh token
  await TestValidator.error(
    "refresh with malformed token should fail",
    async () => {
      const invalidBody = {
        token: "invalid.token.string",
      } satisfies IShoppingMallAdminUser.IRefresh;
      await api.functional.auth.adminUser.refresh(connection, {
        body: invalidBody,
      });
    },
  );
}
