import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * Test the seller user password reset request endpoint with a
 * non-registered (invalid) email.
 *
 * The test first creates a valid seller user account using the join
 * endpoint to ensure the environment is set. Then, it attempts a password
 * reset request with an email that does not exist in the system. The API
 * should handle this gracefully without revealing if the email is
 * registered. The test verifies no errors are thrown and type safety is
 * ensured with typia asserts.
 *
 * Steps:
 *
 * 1. Create a new seller user with random valid data using the join API.
 * 2. Prepare an invalid email address different from the registered email.
 * 3. Request password reset with the invalid email via the password reset
 *    endpoint.
 * 4. Confirm no errors are thrown and request completes successfully.
 */
export async function test_api_seller_password_reset_request_invalid_email(
  connection: api.IConnection,
) {
  // Step 1: Create a new seller user account
  const createBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password: RandomGenerator.alphaNumeric(12),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    phone_number: undefined, // optional omitted
    business_registration_number: RandomGenerator.alphaNumeric(12),
  } satisfies IShoppingMallSellerUser.ICreate;

  const seller: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: createBody,
    });
  typia.assert(seller);

  // Step 2: Prepare an invalid/non-registered email different from the created one
  let invalidEmail: string;
  do {
    invalidEmail = typia.random<string & tags.Format<"email">>();
  } while (invalidEmail === createBody.email);

  // Step 3: Request password reset with the invalid email
  await TestValidator.error(
    "password reset request with invalid email does not throw error",
    async () => {
      await api.functional.auth.sellerUser.password.reset.request.requestPasswordReset(
        connection,
        {
          body: {
            email: invalidEmail,
          } satisfies IShoppingMallSellerUser.IResetPasswordRequest,
        },
      );
    },
  );
}
