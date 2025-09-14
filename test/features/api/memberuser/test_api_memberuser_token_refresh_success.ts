import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * E2E Test for member user token refresh.
 *
 * This test validates the ability to refresh JWT tokens for member users.
 * It ensures that a valid refresh token from a newly joined member user
 * successfully returns new authorization tokens, and that expired or
 * invalid tokens produce errors.
 *
 * Steps:
 *
 * 1. Join a new member user with valid details.
 * 2. Refresh tokens using the received refresh token.
 * 3. Assert that the returned tokens are valid and have correct expiry
 *    formats.
 * 4. Attempt refresh with an invalid/expired token and assert failure.
 */
export async function test_api_memberuser_token_refresh_success(
  connection: api.IConnection,
) {
  // Step 1: Join a new member user
  const email = `user_${RandomGenerator.alphaNumeric(8)}@example.com`;
  const passwordHash = RandomGenerator.alphaNumeric(16);
  const nickname = RandomGenerator.name(2);
  const fullName = RandomGenerator.name(2);
  const phoneNumber = RandomGenerator.mobile();
  const status = "active";

  const createBody = {
    email,
    password_hash: passwordHash,
    nickname,
    full_name: fullName,
    phone_number: phoneNumber,
    status,
  } satisfies IShoppingMallMemberUser.ICreate;

  const authorizedUser = await api.functional.auth.memberUser.join(connection, {
    body: createBody,
  });
  typia.assert(authorizedUser);

  // Step 2: Refresh tokens with the valid refresh token
  const refreshBody = {
    refreshToken: authorizedUser.token.refresh,
  } satisfies IShoppingMallMemberUser.IRefresh;

  const refreshedUser = await api.functional.auth.memberUser.refresh(
    connection,
    {
      body: refreshBody,
    },
  );
  typia.assert(refreshedUser);

  // Step 3: Assert properties of the returned tokens
  TestValidator.predicate(
    "refresh returns new access token",
    typeof refreshedUser.token.access === "string" &&
      refreshedUser.token.access.length > 0,
  );

  TestValidator.predicate(
    "refresh returns new refresh token",
    typeof refreshedUser.token.refresh === "string" &&
      refreshedUser.token.refresh.length > 0,
  );

  TestValidator.predicate(
    "refresh token expired_at is valid ISO date string",
    typeof refreshedUser.token.expired_at === "string" &&
      !isNaN(Date.parse(refreshedUser.token.expired_at)),
  );

  TestValidator.predicate(
    "refresh token refreshable_until is valid ISO date string",
    typeof refreshedUser.token.refreshable_until === "string" &&
      !isNaN(Date.parse(refreshedUser.token.refreshable_until)),
  );

  // Step 4: Test failure with invalid refresh token
  const invalidRefreshBody = {
    refreshToken: "expiredOrInvalidTokenExample1234567890",
  } satisfies IShoppingMallMemberUser.IRefresh;

  await TestValidator.error(
    "refresh fails with invalid or expired token",
    async () => {
      await api.functional.auth.memberUser.refresh(connection, {
        body: invalidRefreshBody,
      });
    },
  );
}
