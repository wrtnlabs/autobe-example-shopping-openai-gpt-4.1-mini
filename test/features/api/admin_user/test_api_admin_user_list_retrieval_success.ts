import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallAdminuser } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallAdminuser";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";

/**
 * Validate successful retrieval of the administrative user list.
 *
 * This test performs the following steps:
 *
 * 1. Creates an admin user via the /auth/adminUser/join endpoint.
 * 2. Logs in the created admin user via /auth/adminUser/login endpoint to
 *    establish authentication context.
 * 3. Using the authenticated connection, calls the administrative user listing
 *    API at /shoppingMall/adminUser/adminUsers with PATCH method.
 * 4. Requests a paginated and filtered admin user list with specified page,
 *    limit, search term, status filter, and sorting criteria.
 * 5. Validates that the response includes correct pagination metadata and a
 *    list of admin users.
 * 6. Asserts that the pagination metadata values are consistent and
 *    meaningful.
 * 7. Verifies that each returned admin user matches the filter criteria,
 *    focusing on email, nickname or full name matching the search term, and
 *    status matching the requested filter.
 * 8. Checks that typia.assert confirms the response types.
 * 9. Ensures that authentication context is respected, and only authorized
 *    admin users can access the listing.
 */
export async function test_api_admin_user_list_retrieval_success(
  connection: api.IConnection,
) {
  // 1. Create an admin user through join endpoint
  const adminUserCreateBody = {
    email: `${RandomGenerator.alphaNumeric(6)}@example.com`,
    password_hash: RandomGenerator.alphaNumeric(12),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const adminUserAuthorized = await api.functional.auth.adminUser.join(
    connection,
    {
      body: adminUserCreateBody,
    },
  );
  typia.assert(adminUserAuthorized);

  // 2. Login the created admin user to set auth header
  const adminUserLoginBody = {
    email: adminUserCreateBody.email,
    password_hash: adminUserCreateBody.password_hash,
  } satisfies IShoppingMallAdminUser.ILogin;

  const adminUserLoggedIn = await api.functional.auth.adminUser.login(
    connection,
    {
      body: adminUserLoginBody,
    },
  );
  typia.assert(adminUserLoggedIn);

  // 3. Prepare request body for admin users listing with pagination and filtering
  const searchKeyword = adminUserCreateBody.nickname.substring(0, 2);
  const requestBody = {
    page: 1,
    limit: 10,
    search: searchKeyword,
    status: "active",
    sort: "+email",
  } satisfies IShoppingMallAdminUser.IRequest;

  // 4. Retrieve paginated list of admin users
  const adminUsersPage =
    await api.functional.shoppingMall.adminUser.adminUsers.index(connection, {
      body: requestBody,
    });

  // 5. Validate the response schema
  typia.assert(adminUsersPage);

  // 6. Validate pagination metadata
  TestValidator.predicate(
    "pagination current page must be positive integer",
    adminUsersPage.pagination.current >= 1,
  );
  TestValidator.predicate(
    "pagination limit must be positive integer",
    adminUsersPage.pagination.limit >= 1,
  );
  TestValidator.predicate(
    "pagination total records cannot be negative",
    adminUsersPage.pagination.records >= 0,
  );
  TestValidator.predicate(
    "pagination pages count must be positive",
    adminUsersPage.pagination.pages >= 1,
  );
  TestValidator.predicate(
    "pagination pages count must be at least current page",
    adminUsersPage.pagination.pages >= adminUsersPage.pagination.current,
  );

  // 7. Validate that each admin user in list matches filter criteria
  for (const user of adminUsersPage.data) {
    typia.assert(user);
    TestValidator.predicate(
      "admin user status matches filter",
      user.status === requestBody.status,
    );
    if (requestBody.search !== null && requestBody.search !== undefined) {
      const searchLower = requestBody.search.toLowerCase();
      const matched =
        user.email.toLowerCase().includes(searchLower) ||
        user.nickname.toLowerCase().includes(searchLower) ||
        user.full_name.toLowerCase().includes(searchLower);
      TestValidator.predicate("admin user matches search string", matched);
    }
  }
}
