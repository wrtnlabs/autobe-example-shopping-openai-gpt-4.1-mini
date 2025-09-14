import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * Test the seller user password change API.
 *
 * 1. A new seller user is generated and registered using the join endpoint.
 * 2. Keep the password of the created user for validation.
 * 3. Use the authenticated connection (after join) to perform password
 *    changes.
 * 4. First, change the password using the correct old password to a new
 *    password.
 * 5. The operation must succeed, returns void.
 * 6. Attempt a password change with an incorrect old password.
 * 7. The operation must fail, rejecting the promise.
 *
 * This test verifies password update success flow and failure on old
 * password mismatch.
 */
export async function test_api_selleruser_password_change_success(
  connection: api.IConnection,
) {
  // 1. Create a new seller user
  const sellerUserEmail = typia.random<string & tags.Format<"email">>();
  const sellerUserPassword = "InitialPassword123!";
  const sellerUserBody = {
    email: sellerUserEmail,
    password: sellerUserPassword,
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    phone_number: null, // explicitly null optional
    business_registration_number: RandomGenerator.alphaNumeric(10),
  } satisfies IShoppingMallSellerUser.ICreate;

  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: sellerUserBody,
    });
  typia.assert(sellerUser);

  // 2. Change password with correct old password
  const newPassword = "NewPassword123!";
  await api.functional.auth.sellerUser.password.change.changePassword(
    connection,
    {
      body: {
        oldPassword: sellerUserPassword,
        newPassword: newPassword,
      } satisfies IShoppingMallSellerUser.IChangePassword,
    },
  );

  // 3. Attempt to change password with incorrect old password and expect error
  await TestValidator.error(
    "password change fails with incorrect old password",
    async () => {
      await api.functional.auth.sellerUser.password.change.changePassword(
        connection,
        {
          body: {
            oldPassword: "WrongOldPassword!",
            newPassword: "AnotherNewPassword123!",
          } satisfies IShoppingMallSellerUser.IChangePassword,
        },
      );
    },
  );
}
