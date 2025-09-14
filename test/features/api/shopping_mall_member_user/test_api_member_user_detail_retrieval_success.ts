import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * Validate successful retrieval of detailed member user information via
 * admin endpoint.
 *
 * This test establishes admin user authentication context by registering
 * and logging in an admin user. Then it performs retrieval of a member user
 * detail by UUID. Validates that returned data matches the expected
 * schema.
 *
 * Steps:
 *
 * 1. Admin user signup (join)
 * 2. Admin user login
 * 3. Retrieve member user detail by id
 * 4. Assert response structure and required fields
 */
export async function test_api_member_user_detail_retrieval_success(
  connection: api.IConnection,
) {
  // Step 1: Admin user join
  const adminUserCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(32),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const adminUserAuthorized: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminUserCreateBody,
    });
  typia.assert(adminUserAuthorized);

  // Step 2: Admin user login
  const adminUserLoginBody = {
    email: adminUserCreateBody.email,
    password_hash: adminUserCreateBody.password_hash,
  } satisfies IShoppingMallAdminUser.ILogin;

  const adminUserLoginAuthorized: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.login(connection, {
      body: adminUserLoginBody,
    });
  typia.assert(adminUserLoginAuthorized);

  // Step 3: Retrieve member user detail by id
  // For test purposes, generate a new UUID
  const memberUserId: string & tags.Format<"uuid"> = typia.random<
    string & tags.Format<"uuid">
  >();

  const memberUserDetail: IShoppingMallMemberUser =
    await api.functional.shoppingMall.adminUser.memberUsers.at(connection, {
      id: memberUserId,
    });
  typia.assert(memberUserDetail);

  // Step 4: Validate returned member user id matches requested id
  TestValidator.equals(
    "member user id must match requested id",
    memberUserDetail.id,
    memberUserId,
  );

  // Additional property validations
  TestValidator.predicate(
    "member user email is string",
    typeof memberUserDetail.email === "string",
  );
  TestValidator.predicate(
    "member user password_hash is string",
    typeof memberUserDetail.password_hash === "string",
  );
  TestValidator.predicate(
    "member user nickname is string",
    typeof memberUserDetail.nickname === "string",
  );
  TestValidator.predicate(
    "member user full_name is string",
    typeof memberUserDetail.full_name === "string",
  );
  TestValidator.predicate(
    "member user status is string",
    typeof memberUserDetail.status === "string",
  );
  TestValidator.predicate(
    "member user created_at is string",
    typeof memberUserDetail.created_at === "string",
  );
  TestValidator.predicate(
    "member user updated_at is string",
    typeof memberUserDetail.updated_at === "string",
  );
  TestValidator.predicate(
    "member user deleted_at is null or string",
    memberUserDetail.deleted_at === null ||
      typeof memberUserDetail.deleted_at === "string",
  );
}
