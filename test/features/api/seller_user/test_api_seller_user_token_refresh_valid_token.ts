import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * Validates JWT token refresh for a seller user using a valid refresh
 * token.
 *
 * This test covers the complete authentication lifecycle:
 *
 * 1. Register a new seller user with all required fields.
 * 2. Login the seller user to obtain access and refresh tokens.
 * 3. Call the refresh endpoint with the valid refresh token.
 * 4. Validate the refreshed tokens and authorization information.
 *
 * Comprehensive checks include verifying token presence, expiration
 * timestamp formats, and correct token lifecycle order, ensuring the
 * backend adheres to security policies regarding JWT token renewal and
 * validity.
 */
export async function test_api_seller_user_token_refresh_valid_token(
  connection: api.IConnection,
) {
  // 1. Register (join) a new seller user
  const email = typia.random<string & tags.Format<"email">>();
  const password = "P@ssword123!";
  const nickname = RandomGenerator.name();
  const full_name = RandomGenerator.name(2);
  const phone_number = null; // Optional, explicitly null
  const business_registration_number = `BRN${RandomGenerator.alphaNumeric(9).toUpperCase()}`;

  const joined: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: {
        email,
        password,
        nickname,
        full_name,
        phone_number,
        business_registration_number,
      } satisfies IShoppingMallSellerUser.ICreate,
    });
  typia.assert(joined);
  TestValidator.predicate(
    "joined user has valid email format",
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(joined.email),
  );

  // 2. Login the seller user
  const loggedIn: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.login(connection, {
      body: { email, password } satisfies IShoppingMallSellerUser.ILogin,
    });
  typia.assert(loggedIn);

  TestValidator.predicate(
    "login response has accessToken",
    loggedIn.accessToken !== undefined && loggedIn.accessToken.length > 0,
  );
  TestValidator.predicate(
    "login response has refreshToken",
    loggedIn.refreshToken !== undefined && loggedIn.refreshToken.length > 0,
  );

  // 3. Refresh token using the refreshToken from login
  const refreshBody: IShoppingMallSellerUser.IRefresh = {
    refreshToken: loggedIn.refreshToken ?? "",
  };
  const refreshed: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.refresh(connection, {
      body: refreshBody,
    });
  typia.assert(refreshed);

  // 4. Validate refreshed tokens and token info
  TestValidator.predicate(
    "refreshed access token is defined",
    refreshed.accessToken !== undefined && refreshed.accessToken.length > 0,
  );
  TestValidator.predicate(
    "refreshed refresh token is defined",
    refreshed.refreshToken !== undefined && refreshed.refreshToken.length > 0,
  );

  const expiredAt = refreshed.token.expired_at;
  const refreshableUntil = refreshed.token.refreshable_until;

  // Validate valid ISO date-time strings
  TestValidator.predicate(
    "token.expired_at is valid ISO 8601",
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(expiredAt),
  );
  TestValidator.predicate(
    "token.refreshable_until is valid ISO 8601",
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/.test(refreshableUntil),
  );

  // Validate refreshable_until > expired_at
  const expiredAtTime = new Date(expiredAt).getTime();
  const refreshableUntilTime = new Date(refreshableUntil).getTime();
  TestValidator.predicate(
    "token.refreshable_until is after expired_at",
    refreshableUntilTime > expiredAtTime,
  );
}
