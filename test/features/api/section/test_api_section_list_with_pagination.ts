import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallSection } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallSection";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallSection } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSection";

/**
 * This test function validates the paginated retrieval of shopping mall
 * sections by an admin user.
 *
 * The test first creates an admin user and authenticates to ensure
 * authorization context. After that, it performs paginated requests to the
 * sections listing API with filter parameters. The filtering includes
 * "status" and "search" keyword to verify correct filtering and pagination.
 * The test asserts the correctness of:
 *
 * - Pagination metadata fields (current page, limit, total pages, total
 *   records)
 * - The correctness of the filtered data elements per the status and search
 *   parameters
 * - That the pagination respects the requested page size and page number
 * - That the status of all returned sections matches the requested status
 * - That the section's name or code contains the search keyword
 *
 * The test leverages TestValidator to ensure business logic correctness and
 * typia.assert for structural validation.
 */
export async function test_api_section_list_with_pagination(
  connection: api.IConnection,
) {
  // 1. Create an admin user to authenticate and establish admin context
  const adminUserCreateRequest = {
    email: `admin_${RandomGenerator.alphaNumeric(6)}@example.com`,
    password_hash: RandomGenerator.alphaNumeric(12),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminUserCreateRequest,
    });
  typia.assert(adminUser);

  // 2. Prepare various filtering and pagination parameters to test
  const testPage = 1;
  const testLimit = 10;
  const testStatus = "active";
  const testSearchKeyword = adminUser.nickname.substring(0, 2);

  // 3. Perform paginated section query with filters
  const response: IPageIShoppingMallSection.ISummary =
    await api.functional.shoppingMall.adminUser.sections.index(connection, {
      body: {
        page: testPage,
        limit: testLimit,
        status: testStatus,
        search: testSearchKeyword,
      } satisfies IShoppingMallSection.IRequest,
    });
  typia.assert(response);

  // 4. Validate pagination metadata
  const pagination: IPage.IPagination = response.pagination;
  TestValidator.predicate(
    "pagination current page equals requested page",
    pagination.current === testPage,
  );
  TestValidator.predicate(
    "pagination limit equals requested limit",
    pagination.limit === testLimit,
  );
  TestValidator.predicate(
    "pagination pages is positive",
    pagination.pages >= 0,
  );
  TestValidator.predicate(
    "pagination records is non-negative",
    pagination.records >= 0,
  );

  // 5. Validate that the returned data matches the filtering criteria
  for (const section of response.data) {
    typia.assert(section);
    TestValidator.equals(
      "section status matches filter",
      section.status,
      testStatus,
    );
    // Check if name or code contains the search keyword (case insensitive)
    const nameContains = section.name
      .toLowerCase()
      .includes(testSearchKeyword.toLowerCase());
    const codeContains = section.code
      .toLowerCase()
      .includes(testSearchKeyword.toLowerCase());
    TestValidator.predicate(
      "section name or code contains search keyword",
      nameContains || codeContains,
    );
  }

  // 6. Validate page size correctness: the length of results should be <= limit
  TestValidator.predicate(
    "response data length respects limit",
    response.data.length <= testLimit,
  );
}
