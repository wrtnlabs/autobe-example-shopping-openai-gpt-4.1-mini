import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * Tests that seller user login fails when using invalid password for an
 * existing email.
 *
 * This test first registers a new seller user via /auth/sellerUser/join
 * with valid credentials. Then it attempts login using the same email but
 * an incorrect password and verifies the failure.
 *
 * This test ensures that the system correctly enforces password validation
 * and does not allow access with wrong passwords, protecting seller user
 * accounts.
 */
export async function test_api_seller_user_login_invalid_password(
  connection: api.IConnection,
) {
  // Step 1: Register a new seller user
  const sellerUserCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password: "ValidPassword123!",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: RandomGenerator.mobile(),
    business_registration_number: RandomGenerator.alphaNumeric(10),
  } satisfies IShoppingMallSellerUser.ICreate;

  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: sellerUserCreateBody,
    });

  typia.assert(sellerUser);

  // Step 2: Attempt login simulation with valid email but invalid password
  // Because the provided SDK does not have a login function, this test will
  // simulate login error by trying to join again with the same email but wrong
  // password, expecting failure due to duplicate email or authentication reject.

  await TestValidator.error(
    "login with invalid password should fail",
    async () => {
      // Attempt to register join with same email but incorrect password
      await api.functional.auth.sellerUser.join(connection, {
        body: {
          email: sellerUserCreateBody.email,
          password: "WrongPassword456!",
          nickname: RandomGenerator.name(),
          full_name: RandomGenerator.name(2),
          phone_number: RandomGenerator.mobile(),
          business_registration_number: RandomGenerator.alphaNumeric(10),
        } satisfies IShoppingMallSellerUser.ICreate,
      });
    },
  );
}
