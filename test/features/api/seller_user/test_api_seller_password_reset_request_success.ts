import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * Test scenario for successful password reset request for a seller user.
 *
 * This test function performs the following steps:
 *
 * 1. Creates a new seller user using the join API with all required fields.
 * 2. Asserts the returned seller user authorization data ensuring all fields
 *    are valid.
 * 3. Initiates a password reset request with the exact email used in the
 *    creation step.
 * 4. Ensures the password reset request completes without error, verifying
 *    secure behavior (no info leak about user existence).
 */
export async function test_api_seller_password_reset_request_success(
  connection: api.IConnection,
) {
  // Step 1: Create a new seller user with required attributes
  const sellerEmail: string & tags.Format<"email"> = typia.random<
    string & tags.Format<"email">
  >();
  const sellerCreateBody = {
    email: sellerEmail,
    password: "ValidPassword123!",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    business_registration_number: RandomGenerator.alphaNumeric(10),
    phone_number: null,
  } satisfies IShoppingMallSellerUser.ICreate;

  const seller: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: sellerCreateBody,
    });
  typia.assert(seller);

  // Step 2: Initiate password reset request with the registered email
  await api.functional.auth.sellerUser.password.reset.request.requestPasswordReset(
    connection,
    {
      body: {
        email: sellerEmail,
      } satisfies IShoppingMallSellerUser.IResetPasswordRequest,
    },
  );
}
