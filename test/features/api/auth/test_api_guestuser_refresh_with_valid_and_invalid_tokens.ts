import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallGuestUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallGuestUser";

/**
 * Test refreshing JWT authorization tokens for guest users.
 *
 * This test covers the flow where a guest user joins the system to receive
 * initial tokens, then refreshes those tokens using the refresh token, and
 * validates that new tokens are generated correctly.
 *
 * It also tests failure case where the refresh token is invalid, ensuring
 * the API rejects such requests appropriately.
 *
 * The steps include:
 *
 * 1. Perform guestUser join to obtain valid token.
 * 2. Use the refresh token to call refresh endpoint successfully.
 * 3. Validate the contents and structure of the refreshed token response.
 * 4. Test refresh request with invalid refresh_token and expect failure.
 */
export async function test_api_guestuser_refresh_with_valid_and_invalid_tokens(
  connection: api.IConnection,
) {
  // 1. Guest user join
  const joinBody = {
    ip_address: "127.0.0.1",
    access_url: "https://example.com",
    referrer: null,
    user_agent: null,
  } satisfies IShoppingMallGuestUser.IJoin;

  const authorized: IShoppingMallGuestUser.IAuthorized =
    await api.functional.auth.guestUser.join(connection, { body: joinBody });
  typia.assert(authorized);

  // 2. Refresh token with valid refresh token
  const refreshBodyValid = {
    refresh_token: authorized.token.refresh,
  } satisfies IShoppingMallGuestUser.IRefresh;

  const refreshed: IShoppingMallGuestUser.IAuthorized =
    await api.functional.auth.guestUser.refresh(connection, {
      body: refreshBodyValid,
    });
  typia.assert(refreshed);

  TestValidator.predicate(
    "refresh token updated",
    refreshed.token.refresh !== authorized.token.refresh,
  );

  TestValidator.predicate(
    "access token updated",
    refreshed.token.access !== authorized.token.access,
  );

  const expiredAtDate = new Date(refreshed.token.expired_at);
  const refreshableUntilDate = new Date(refreshed.token.refreshable_until);
  const now = new Date();
  TestValidator.predicate(
    "expired_at is in the future",
    expiredAtDate.getTime() > now.getTime(),
  );
  TestValidator.predicate(
    "refreshable_until is in the future",
    refreshableUntilDate.getTime() > now.getTime(),
  );

  // 3. Refresh token with invalid refresh_token expects failure
  const invalidRefreshToken = typia.random<string>();
  const refreshBodyInvalid = {
    refresh_token: invalidRefreshToken,
  } satisfies IShoppingMallGuestUser.IRefresh;

  await TestValidator.error("invalid refresh_token should fail", async () => {
    await api.functional.auth.guestUser.refresh(connection, {
      body: refreshBodyInvalid,
    });
  });
}
