import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

export async function test_api_selleruser_password_reset_confirm_success(
  connection: api.IConnection,
) {
  // 1. Seller user joins
  const sellerUserCreate = {
    email: `test_seller_${RandomGenerator.alphaNumeric(6)}@example.com`,
    password: "StrongP@ssw0rd!",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: "01012345678",
    business_registration_number: `BRN${RandomGenerator.alphaNumeric(9).toUpperCase()}`,
  } satisfies IShoppingMallSellerUser.ICreate;

  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: sellerUserCreate,
    });
  typia.assert(sellerUser);

  // 2. Request password reset
  await api.functional.auth.sellerUser.password.reset.request.requestPasswordReset(
    connection,
    {
      body: {
        email: sellerUser.email,
      } satisfies IShoppingMallSellerUser.IResetPasswordRequest,
    },
  );

  // Since no API to get the real token, simulate a valid token with fixed string.
  // In real environment, this should be replaced with actual token retrieval.
  const validResetToken = "TEST_VALID_RESET_TOKEN_1234567890";
  const newPassword = "NewStr0ngP@ss!";

  // 3. Confirm password reset with valid token
  await api.functional.auth.sellerUser.password.reset.confirm.confirmPasswordReset(
    connection,
    {
      body: {
        resetToken: validResetToken,
        newPassword: newPassword,
      } satisfies IShoppingMallSellerUser.IResetPasswordConfirm,
    },
  );

  // 4. Confirm password reset with invalid token should throw error
  await TestValidator.error(
    "Invalid reset token should cause error",
    async () => {
      await api.functional.auth.sellerUser.password.reset.confirm.confirmPasswordReset(
        connection,
        {
          body: {
            resetToken: "invalid_token_1234",
            newPassword: newPassword,
          } satisfies IShoppingMallSellerUser.IResetPasswordConfirm,
        },
      );
    },
  );
}
