import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * Test that attempting to log in as a seller user with a valid email but
 * invalid password correctly fails and returns an error, ensuring no
 * authorization tokens are issued.
 *
 * Business Context:
 *
 * - A seller user must be registered (joined) before login.
 * - Login with wrong password must not succeed.
 *
 * Test Steps:
 *
 * 1. Register a new seller user with a unique email and valid required data.
 * 2. Attempt login with the same email but an invalid password.
 * 3. Expect an error to be thrown (e.g., 401 Unauthorized) without tokens
 *    being issued.
 *
 * This test ensures unauthorized access is prevented and security policies
 * are enforced.
 */
export async function test_api_seller_user_login_invalid_password(
  connection: api.IConnection,
) {
  // 1. Register seller user
  const email: string & tags.Format<"email"> = typia.random<
    string & tags.Format<"email">
  >();
  const password = "ValidPass123!";
  const joinBody = {
    email,
    password,
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    phone_number: null,
    business_registration_number: RandomGenerator.alphaNumeric(10),
  } satisfies IShoppingMallSellerUser.ICreate;

  const authorizedUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: joinBody,
    });
  typia.assert(authorizedUser);

  // 2. Login with invalid password
  const invalidLoginBody = {
    email,
    password: "WrongPassword!",
  } satisfies IShoppingMallSellerUser.ILogin;

  await TestValidator.error(
    "login should fail with invalid password",
    async () => {
      await api.functional.auth.sellerUser.login(connection, {
        body: invalidLoginBody,
      });
    },
  );
}
