import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * Test member user registration by posting valid member data including email,
 * password, nickname, and full name.
 *
 * Verify successful creation returns the member's unique ID and authorization
 * JWT tokens (access and refresh) with correct expiration.
 *
 * Test failure scenario by attempting registration with duplicate email,
 * expecting error response.
 *
 * Ensure password is handled securely and omitted from response tokens except
 * as hashed password where appropriate.
 *
 * Optional phone number and deleted_at fields are explicitly set to null to
 * verify their handling.
 */
export async function test_api_memberuser_join_success_and_duplicate_email(
  connection: api.IConnection,
) {
  // Step 1: Register a new member user successfully
  const password = RandomGenerator.alphaNumeric(10); // simulate a hashed password string for test
  const createRequest1 = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: password,
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: null,
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;

  const authorized1: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: createRequest1,
    });
  typia.assert(authorized1);

  // Validate that the returned id is a non-empty UUID string
  TestValidator.predicate(
    "registered user id is non-empty",
    typeof authorized1.id === "string" && authorized1.id.length > 0,
  );

  TestValidator.equals(
    "email matches",
    authorized1.email,
    createRequest1.email,
  );
  TestValidator.equals(
    "nickname matches",
    authorized1.nickname,
    createRequest1.nickname,
  );
  TestValidator.equals(
    "full_name matches",
    authorized1.full_name,
    createRequest1.full_name,
  );
  TestValidator.equals("phone_number is null", authorized1.phone_number, null);
  TestValidator.equals("status is active", authorized1.status, "active");

  // Validate date-time fields for proper presence
  TestValidator.predicate(
    "created_at has proper date-time format",
    typeof authorized1.created_at === "string" &&
      authorized1.created_at.length > 0,
  );
  TestValidator.predicate(
    "updated_at has proper date-time format",
    typeof authorized1.updated_at === "string" &&
      authorized1.updated_at.length > 0,
  );

  // deleted_at can be null explicitly
  TestValidator.equals("deleted_at is null", authorized1.deleted_at, null);

  // Password hash should be present and non-empty
  TestValidator.predicate(
    "password_hash is non-empty",
    typeof authorized1.password_hash === "string" &&
      authorized1.password_hash.length > 0,
  );

  // Validate token object with necessary fields
  const token: IAuthorizationToken = authorized1.token;
  TestValidator.predicate(
    "token.access is non-empty",
    typeof token.access === "string" && token.access.length > 0,
  );
  TestValidator.predicate(
    "token.refresh is non-empty",
    typeof token.refresh === "string" && token.refresh.length > 0,
  );
  TestValidator.predicate(
    "token.expired_at is ISO date-time",
    typeof token.expired_at === "string" && token.expired_at.length > 0,
  );
  TestValidator.predicate(
    "token.refreshable_until is ISO date-time",
    typeof token.refreshable_until === "string" &&
      token.refreshable_until.length > 0,
  );

  // Step 2: Attempt duplicate email registration, expect an error
  await TestValidator.error("duplicate email should fail", async () => {
    const createDuplicate = {
      ...createRequest1,
      nickname: RandomGenerator.name(),
      full_name: RandomGenerator.name(2),
      phone_number: null,
      status: "active",
    } satisfies IShoppingMallMemberUser.ICreate;

    await api.functional.auth.memberUser.join(connection, {
      body: createDuplicate,
    });
  });
}
