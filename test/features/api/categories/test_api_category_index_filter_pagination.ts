import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallCategory } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallCategory";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallCategory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCategory";

/**
 * Validate paginated category listings with filters, search, pagination,
 * and sorting.
 *
 * This test authenticates an admin user and subsequently performs multiple
 * category index queries using different filters such as status (e.g.,
 * "active", "deleted"), search terms, pagination parameters (page and
 * limit), and sorting scenarios. It asserts that response data conforms to
 * expected pagination details and that all category summary entries match
 * the given criteria. The test covers positive and edge cases including
 * empty results and verifies format compliance for IDs and other fields.
 */
export async function test_api_category_index_filter_pagination(
  connection: api.IConnection,
) {
  // Step 1: Admin user authentication via join
  const adminUserEmail: string = typia.random<string & tags.Format<"email">>();
  const adminUserPasswordHash = "hashed-password";
  const adminUserNickname = RandomGenerator.name();
  const adminUserFullName = RandomGenerator.name();
  const adminUserStatus = "active";

  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: adminUserEmail,
        password_hash: adminUserPasswordHash,
        nickname: adminUserNickname,
        full_name: adminUserFullName,
        status: adminUserStatus,
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // Helper function to validate pagination response
  function validatePagination(
    page: IPage.IPagination,
    expectedPage: number,
    expectedLimit: number,
  ) {
    TestValidator.predicate(
      "pagination.current page is positive integer",
      Number.isInteger(page.current) && page.current >= 0,
    );
    TestValidator.predicate(
      "pagination.limit is positive integer",
      Number.isInteger(page.limit) && page.limit >= 0,
    );
    TestValidator.predicate(
      "pagination.records is non-negative integer",
      Number.isInteger(page.records) && page.records >= 0,
    );
    TestValidator.predicate(
      "pagination.pages is non-negative integer",
      Number.isInteger(page.pages) && page.pages >= 0,
    );
    TestValidator.equals(
      "pagination.current matches expected",
      page.current,
      expectedPage,
    );
    TestValidator.equals(
      "pagination.limit matches expected",
      page.limit,
      expectedLimit,
    );
    TestValidator.predicate(
      "pagination.pages x limit >= records",
      page.pages * page.limit >= page.records,
    );
  }

  // Helper function to validate category summary structure
  async function validateCategorySummary(
    categories: IShoppingMallCategory.ISummary[],
    expectedStatusFilter?: string | null | undefined,
    expectedSearchFilter?: string | null | undefined,
  ) {
    for (const category of categories) {
      typia.assert(category);
      TestValidator.equals(
        "category.id is UUID",
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
          category.id,
        ),
        true,
      );
      TestValidator.predicate(
        "category.code is non-empty string",
        typeof category.code === "string" && category.code.length > 0,
      );
      TestValidator.predicate(
        "category.name is non-empty string",
        typeof category.name === "string" && category.name.length > 0,
      );
      TestValidator.predicate(
        "category.status is string",
        typeof category.status === "string",
      );
      if (
        expectedStatusFilter !== null &&
        expectedStatusFilter !== undefined &&
        expectedStatusFilter.length > 0
      )
        TestValidator.equals(
          "category.status matches filter",
          category.status,
          expectedStatusFilter,
        );
      if (
        expectedSearchFilter !== null &&
        expectedSearchFilter !== undefined &&
        expectedSearchFilter.length > 0
      ) {
        TestValidator.predicate(
          `category.name or code contains search term: ${expectedSearchFilter}`,
          category.name.includes(expectedSearchFilter) ||
            category.code.includes(expectedSearchFilter),
        );
      }
    }
  }

  // Test 1: Index categories without filters (defaults)
  {
    const body = {} satisfies IShoppingMallCategory.IRequest;
    const response: IPageIShoppingMallCategory.ISummary =
      await api.functional.shoppingMall.adminUser.categories.index(connection, {
        body,
      });
    typia.assert(response);
    validatePagination(response.pagination, 0, 0);
    await validateCategorySummary(response.data);
  }

  // Test 2: Filter by status "active"
  {
    const body: IShoppingMallCategory.IRequest = {
      status: "active",
    };
    const response: IPageIShoppingMallCategory.ISummary =
      await api.functional.shoppingMall.adminUser.categories.index(connection, {
        body,
      });
    typia.assert(response);
    validatePagination(response.pagination, 0, 0);
    await validateCategorySummary(response.data, "active");
  }

  // Test 3: Filter by status "deleted"
  {
    const body: IShoppingMallCategory.IRequest = {
      status: "deleted",
    };
    const response: IPageIShoppingMallCategory.ISummary =
      await api.functional.shoppingMall.adminUser.categories.index(connection, {
        body,
      });
    typia.assert(response);
    validatePagination(response.pagination, 0, 0);
    await validateCategorySummary(response.data, "deleted");
  }

  // Test 4: Search by partial name or code
  {
    const searchTerm = RandomGenerator.paragraph({
      sentences: 1,
      wordMin: 3,
      wordMax: 10,
    });
    const body: IShoppingMallCategory.IRequest = {
      search: searchTerm,
    };
    const response: IPageIShoppingMallCategory.ISummary =
      await api.functional.shoppingMall.adminUser.categories.index(connection, {
        body,
      });
    typia.assert(response);
    validatePagination(response.pagination, 0, 0);
    await validateCategorySummary(response.data, undefined, searchTerm);
  }

  // Test 5: Pagination parameters page and limit
  {
    // Random page >= 0 and limit > 0
    const page = Math.floor(Math.random() * 5);
    const limit = 10;
    const body: IShoppingMallCategory.IRequest = {
      page,
      limit,
    };
    const response: IPageIShoppingMallCategory.ISummary =
      await api.functional.shoppingMall.adminUser.categories.index(connection, {
        body,
      });
    typia.assert(response);
    validatePagination(response.pagination, page, limit);
    await validateCategorySummary(response.data);
  }

  // Test 6: Search with paging and status filter
  {
    const searchTerm = RandomGenerator.paragraph({
      sentences: 1,
      wordMin: 3,
      wordMax: 10,
    });
    const page = 0;
    const limit = 5;
    const body: IShoppingMallCategory.IRequest = {
      page,
      limit,
      search: searchTerm,
      status: "active",
    };
    const response: IPageIShoppingMallCategory.ISummary =
      await api.functional.shoppingMall.adminUser.categories.index(connection, {
        body,
      });
    typia.assert(response);
    validatePagination(response.pagination, page, limit);
    await validateCategorySummary(response.data, "active", searchTerm);
  }

  // Test 7: Search with paging and status "deleted"
  {
    const page = 1;
    const limit = 5;
    const body: IShoppingMallCategory.IRequest = {
      page,
      limit,
      status: "deleted",
    };
    const response: IPageIShoppingMallCategory.ISummary =
      await api.functional.shoppingMall.adminUser.categories.index(connection, {
        body,
      });
    typia.assert(response);
    validatePagination(response.pagination, page, limit);
    await validateCategorySummary(response.data, "deleted");
  }

  // Test 8: Filter with no results expected
  {
    const body: IShoppingMallCategory.IRequest = {
      search: "non_existent_search_term_12345",
    };
    const response: IPageIShoppingMallCategory.ISummary =
      await api.functional.shoppingMall.adminUser.categories.index(connection, {
        body,
      });
    typia.assert(response);
    validatePagination(response.pagination, 0, 0);
    TestValidator.equals("empty result set", response.data.length, 0);
  }
}
