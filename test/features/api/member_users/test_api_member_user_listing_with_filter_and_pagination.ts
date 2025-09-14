import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallMemberUser";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

export async function test_api_member_user_listing_with_filter_and_pagination(
  connection: api.IConnection,
) {
  // 1. Admin user join (create account and authenticate)
  const adminEmail = typia.random<string & tags.Format<"email">>();
  const adminPasswordHash = RandomGenerator.alphaNumeric(64); // Simulating password hash
  const adminCreateBody = {
    email: adminEmail,
    password_hash: adminPasswordHash,
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminCreateBody,
    });
  typia.assert(adminUser);

  // 2. Admin user login
  const adminLoginBody = {
    email: adminEmail,
    password_hash: adminPasswordHash,
  } satisfies IShoppingMallAdminUser.ILogin;

  const loggedInAdmin: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.login(connection, {
      body: adminLoginBody,
    });
  typia.assert(loggedInAdmin);

  // 3. Perform member user paginated search with filters
  // Use filtering for email, nickname, status and pagination parameters
  const memberUserRequest: IShoppingMallMemberUser.IRequest = {
    email: "member@example.com",
    nickname: "member",
    status: "active",
    page: 1,
    limit: 10,
  };

  const pageResult: IPageIShoppingMallMemberUser.ISummary =
    await api.functional.shoppingMall.adminUser.memberUsers.index(connection, {
      body: memberUserRequest,
    });
  typia.assert(pageResult);

  // 4. Assert the pagination metadata
  const pagination = pageResult.pagination;
  TestValidator.predicate(
    "pagination current page should be positive int",
    typeof pagination.current === "number" && pagination.current > 0,
  );
  TestValidator.predicate(
    "pagination limit should be positive int",
    typeof pagination.limit === "number" && pagination.limit > 0,
  );
  TestValidator.predicate(
    "pagination records should be non-negative int",
    typeof pagination.records === "number" && pagination.records >= 0,
  );
  TestValidator.predicate(
    "pagination pages should be positive int",
    typeof pagination.pages === "number" && pagination.pages > 0,
  );

  // 5. Validate consistency between pagination values
  TestValidator.equals(
    "pagination current page matches requested page",
    pagination.current,
    memberUserRequest.page,
  );
  TestValidator.equals(
    "pagination limit matches requested limit",
    pagination.limit,
    memberUserRequest.limit,
  );
  TestValidator.predicate(
    "pagination pages consistent with records and limit",
    pagination.pages >= 1 &&
      pagination.pages * pagination.limit >= pagination.records,
  );

  // 6. Validate member user summary properties
  for (const member of pageResult.data) {
    // id is UUID format
    TestValidator.predicate(
      `member user id ${member.id} should be UUID format`,
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        member.id,
      ),
    );

    // Check required string properties existence
    TestValidator.predicate(
      `member user email ${member.email} is non-empty string`,
      typeof member.email === "string" && member.email.length > 0,
    );
    TestValidator.predicate(
      `member user nickname ${member.nickname} is non-empty string`,
      typeof member.nickname === "string" && member.nickname.length > 0,
    );
    TestValidator.predicate(
      `member user full_name ${member.full_name} is non-empty string`,
      typeof member.full_name === "string" && member.full_name.length > 0,
    );

    // status string non-empty
    TestValidator.predicate(
      `member user status ${member.status} is non-empty string`,
      typeof member.status === "string" && member.status.length > 0,
    );

    // created_at ISO date-time format
    TestValidator.predicate(
      `member user created_at ${member.created_at} is ISO 8601 date-time string`,
      /^\\d{4}-\\d{2}-\\d{2}T\\d{2}:\\d{2}:\\d{2}\.\\d{3}Z$/.test(
        member.created_at,
      ),
    );
  }
}
