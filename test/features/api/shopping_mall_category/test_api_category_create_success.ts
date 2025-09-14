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
 * Validate admin user category creation process.
 *
 * Due to the lack of a dedicated category creation API, this test validates
 * the admin user creation along with the category search API for the
 * shopping mall admin user role.
 *
 * It ensures:
 *
 * - Successful admin user join with valid data.
 * - Ability to fetch paginated category summaries with the category listing
 *   API.
 */
export async function test_api_category_create_success(
  connection: api.IConnection,
) {
  // 1. Create admin user
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: typia.random<string & tags.Format<"email">>(),
        password_hash: RandomGenerator.alphaNumeric(32),
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        status: "active",
      },
    });
  typia.assert(adminUser);

  // 2. Search for categories to validate endpoint
  const categoriesResponse: IPageIShoppingMallCategory.ISummary =
    await api.functional.shoppingMall.adminUser.categories.index(connection, {
      body: {
        page: 1,
        limit: 10,
      },
    });
  typia.assert(categoriesResponse);

  TestValidator.predicate(
    "categories has pagination info",
    categoriesResponse.pagination !== null &&
      typeof categoriesResponse.pagination === "object",
  );
  TestValidator.predicate(
    "categories data is array",
    Array.isArray(categoriesResponse.data),
  );
}
