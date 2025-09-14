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
 * Test searching categories with authorized admin user and validating
 * authorization enforcement.
 *
 * This test does NOT perform a category deletion because the provided API
 * endpoint (/shoppingMall/adminUser/categories PATCH) is a search/filter
 * API, and no explicit category deletion API is provided.
 *
 * Workflow:
 *
 * 1. Create and authenticate an admin user.
 * 2. Perform a search request using PATCH /shoppingMall/adminUser/categories
 *    with valid pagination and filters to retrieve category summaries.
 * 3. Verify that the response data is well-formed and contains categories.
 * 4. Attempt to perform a search with invalid filters that should return
 *    empty.
 * 5. Attempt accessing this endpoint without authentication to ensure access
 *    is denied.
 *
 * This tests basic authorization, filtering, and response validation for
 * the categories search API.
 *
 * @param connection Authorization-enabled connection to API.
 */
export async function test_api_category_erase_success(
  connection: api.IConnection,
) {
  // Step 1: Create and authenticate admin user
  const adminUser = await api.functional.auth.adminUser.join(connection, {
    body: {
      email: typia.random<string & tags.Format<"email">>(),
      password_hash: RandomGenerator.alphaNumeric(16),
      nickname: RandomGenerator.name(),
      full_name: RandomGenerator.name(),
      status: "active",
    } satisfies IShoppingMallAdminUser.ICreate,
  });
  typia.assert(adminUser);

  // Step 2: Valid category search
  const categories =
    await api.functional.shoppingMall.adminUser.categories.index(connection, {
      body: {
        page: 1,
        limit: 10,
        search: null,
        status: null,
      } satisfies IShoppingMallCategory.IRequest,
    });
  typia.assert(categories);

  TestValidator.predicate(
    "categories data is an array",
    Array.isArray(categories.data),
  );

  // Step 3: Search with a non-existent keyword to get empty data
  const emptySearch =
    await api.functional.shoppingMall.adminUser.categories.index(connection, {
      body: {
        page: 1,
        limit: 10,
        search: "non-existent-category-xyz-123",
        status: "active",
      } satisfies IShoppingMallCategory.IRequest,
    });
  typia.assert(emptySearch);
  TestValidator.equals(
    "empty search returns empty data",
    emptySearch.data.length,
    0,
  );

  // Step 4: Try unauthenticated access
  const unauthConn: api.IConnection = { ...connection, headers: {} };

  await TestValidator.error("unauthenticated access is denied", async () => {
    await api.functional.shoppingMall.adminUser.categories.index(unauthConn, {
      body: {
        page: 1,
        limit: 10,
        search: null,
        status: null,
      } satisfies IShoppingMallCategory.IRequest,
    });
  });
}
