import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";

/**
 * Test administrator user registration with duplicate email address.
 *
 * This test first creates an administrator user with a randomly generated valid
 * email, password hash, nickname, full name, and status set to 'active'. It
 * validates the successful creation and proper response structure.
 *
 * Then, it attempts to create another administrator user with the same email
 * but different other details. This second creation attempt must fail due to
 * the duplicate email constraint, and the test validates that an error is
 * thrown.
 *
 * This ensures the system correctly enforces uniqueness of admin user emails
 * during registration.
 */
export async function test_api_adminuser_join_duplicate_email(
  connection: api.IConnection,
) {
  // Generate unique valid email for initial user
  const email = typia.random<string & tags.Format<"email">>();
  // Common password hash string for testing
  const password_hash = "password_hash_sample";
  // Random nick and full name
  const nickname = RandomGenerator.name();
  const full_name = RandomGenerator.name();
  // Status must be 'active' as per example
  const status = "active";

  // Prepare initial admin user creation body
  const createBody = {
    email: email,
    password_hash: password_hash,
    nickname: nickname,
    full_name: full_name,
    status: status,
  } satisfies IShoppingMallAdminUser.ICreate;

  // Create the first admin user
  const createdUser = await api.functional.auth.adminUser.join(connection, {
    body: createBody,
  });
  typia.assert(createdUser);

  // Attempt creation of another admin user with the same email to cause duplicate error
  await TestValidator.error(
    "duplicate email registration should fail",
    async () => {
      await api.functional.auth.adminUser.join(connection, {
        body: {
          email: email,
          password_hash: "another_password_hash",
          nickname: RandomGenerator.name(),
          full_name: RandomGenerator.name(),
          status: "active",
        } satisfies IShoppingMallAdminUser.ICreate,
      });
    },
  );
}
