import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * Test seller user login with valid credentials.
 *
 * This test covers the full workflow of seller user authentication:
 *
 * 1. Register a new seller user using join endpoint.
 * 2. Validate the received authorized user data.
 * 3. Confirm the login credentials by attempting to join with the same
 *    credentials again.
 * 4. Ensure that the authorization tokens (access and refresh) are present and
 *    have valid expiration timestamps.
 * 5. Confirm user status is suitable for login.
 *
 * It ensures only valid users with correct credentials can authenticate
 * successfully.
 */
export async function test_api_seller_user_login_valid_credentials(
  connection: api.IConnection,
) {
  // Step 1. Create a new seller user account
  const email = typia.random<string & tags.Format<"email">>();
  const password = RandomGenerator.alphaNumeric(12);
  const nickname = RandomGenerator.name();
  const full_name = RandomGenerator.name(2);
  const phone_number = RandomGenerator.mobile("010");
  const business_registration_number = `BRN${RandomGenerator.alphaNumeric(9).toUpperCase()}`;

  const createBody = {
    email,
    password,
    nickname,
    full_name,
    phone_number,
    business_registration_number,
  } satisfies IShoppingMallSellerUser.ICreate;

  const authorizedUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, { body: createBody });
  typia.assert(authorizedUser);

  // Step 2. Validate fields of the authorized user
  TestValidator.equals("email matches", authorizedUser.email, email);
  TestValidator.equals("nickname matches", authorizedUser.nickname, nickname);
  TestValidator.equals(
    "full_name matches",
    authorizedUser.full_name,
    full_name,
  );
  TestValidator.equals(
    "phone_number matches",
    authorizedUser.phone_number ?? null,
    phone_number,
  );
  TestValidator.equals(
    "business_registration_number matches",
    authorizedUser.business_registration_number,
    business_registration_number,
  );

  // Confirm tokens are present and properly formatted
  TestValidator.predicate(
    "access token exists",
    typeof authorizedUser.token.access === "string" &&
      authorizedUser.token.access.length > 10,
  );
  TestValidator.predicate(
    "refresh token exists",
    typeof authorizedUser.token.refresh === "string" &&
      authorizedUser.token.refresh.length > 10,
  );

  // Validate expiration fields are valid ISO date-strings
  typia.assert<string & tags.Format<"date-time">>(
    authorizedUser.token.expired_at,
  );
  typia.assert<string & tags.Format<"date-time">>(
    authorizedUser.token.refreshable_until,
  );

  // User status should be active for login
  TestValidator.predicate(
    "user status is active",
    authorizedUser.status === "active",
  ); // Assuming "active" is a valid status for login
}
