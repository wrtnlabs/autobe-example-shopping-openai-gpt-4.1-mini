import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";

/**
 * Test administrator user registration operation with valid input payload
 * including email, password_hash, nickname, full_name, and status. Upon
 * success, JWT tokens (access and refresh) and correct user data are returned.
 * Includes failure scenario for duplicate email registration. This join
 * operation establishes new admin authentication context.
 */
export async function test_api_adminuser_join_success(
  connection: api.IConnection,
) {
  // 1. Prepare test data
  const email = typia.random<string & tags.Format<"email">>();
  const password_hash = RandomGenerator.alphaNumeric(32); // hashed password representation
  const nickname = RandomGenerator.name(2);
  const full_name = RandomGenerator.name(3);
  const status = "active";

  // 2. Successful join API call
  const authorizedUser = await api.functional.auth.adminUser.join(connection, {
    body: {
      email,
      password_hash,
      nickname,
      full_name,
      status,
    } satisfies IShoppingMallAdminUser.ICreate,
  });
  typia.assert(authorizedUser);

  // 3. Validate returned data
  TestValidator.equals("returned email matches", authorizedUser.email, email);
  TestValidator.equals(
    "returned nickname matches",
    authorizedUser.nickname,
    nickname,
  );
  TestValidator.equals(
    "returned full name matches",
    authorizedUser.full_name,
    full_name,
  );
  TestValidator.equals(
    "returned status matches",
    authorizedUser.status,
    status,
  );
  TestValidator.predicate(
    "token contains access",
    typeof authorizedUser.token.access === "string" &&
      authorizedUser.token.access.length > 0,
  );
  TestValidator.predicate(
    "token contains refresh",
    typeof authorizedUser.token.refresh === "string" &&
      authorizedUser.token.refresh.length > 0,
  );
  TestValidator.predicate(
    "token expired_at is ISO date-time",
    typeof authorizedUser.token.expired_at === "string" &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(
        authorizedUser.token.expired_at,
      ),
  );
  TestValidator.predicate(
    "token refreshable_until is ISO date-time",
    typeof authorizedUser.token.refreshable_until === "string" &&
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(
        authorizedUser.token.refreshable_until,
      ),
  );

  // 4. Error on duplicate email registration
  await TestValidator.error("duplicate email registration fails", async () => {
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email,
        password_hash: RandomGenerator.alphaNumeric(32),
        nickname: RandomGenerator.name(2),
        full_name: RandomGenerator.name(3),
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  });
}
