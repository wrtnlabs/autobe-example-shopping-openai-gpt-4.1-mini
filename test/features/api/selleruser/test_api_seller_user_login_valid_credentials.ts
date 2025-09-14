import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * E2E test function that validates seller user login functionality.
 *
 * It first registers a seller user account with realistic data matching the
 * IShoppingMallSellerUser.ICreate schema. Then it attempts login with the
 * correct credentials and asserts the successful login response conforms to
 * IShoppingMallSellerUser.IAuthorized schema with valid tokens.
 *
 * It also tests login failure when incorrect passwords are used, ensuring
 * security constraints.
 *
 * Due to API limitations, user deletion simulation for failed login is
 * noted but not performed since no update API is available.
 *
 * This comprehensive test guarantees the integrity and security of seller
 * user authentication lifecycle.
 */
export async function test_api_seller_user_login_valid_credentials(
  connection: api.IConnection,
) {
  // Register a new seller user via join
  const createBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password: "ValidPass123!",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: RandomGenerator.mobile() as string | null,
    business_registration_number: RandomGenerator.alphaNumeric(10),
  } satisfies IShoppingMallSellerUser.ICreate;

  const authorized: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, { body: createBody });
  typia.assert(authorized);

  // Validate tokens exist in join response
  TestValidator.predicate(
    "token has access token",
    typeof authorized.token.access === "string" &&
      authorized.token.access.length > 0,
  );
  TestValidator.predicate(
    "token has refresh token",
    typeof authorized.token.refresh === "string" &&
      authorized.token.refresh.length > 0,
  );

  // Attempt login with valid credentials
  const loginBody = {
    email: authorized.email,
    password: createBody.password,
  } satisfies IShoppingMallSellerUser.ILogin;

  const loginResult: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.login(connection, { body: loginBody });
  typia.assert(loginResult);

  TestValidator.equals(
    "login email matches",
    loginResult.email,
    authorized.email,
  );

  // Negative test - login with incorrect password
  const wrongPasswordBody = {
    email: authorized.email,
    password: "WrongPassword!",
  } satisfies IShoppingMallSellerUser.ILogin;

  await TestValidator.error(
    "login with incorrect password should fail",
    async () => {
      await api.functional.auth.sellerUser.login(connection, {
        body: wrongPasswordBody,
      });
    },
  );

  // Note: No update API to set deleted_at or inactivate user to test deleted user login failure
  // So skipping that scenario here.
}
