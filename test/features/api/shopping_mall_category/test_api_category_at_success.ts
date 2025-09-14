import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallCategory } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallCategory";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallCategory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCategory";

export async function test_api_category_at_success(
  connection: api.IConnection,
) {
  // 1. Create an admin user and authenticate
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: `admin_${RandomGenerator.alphaNumeric(6)}@example.com`,
        password_hash: RandomGenerator.alphaNumeric(16),
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // 2. Prepare a valid request body with page, limit, search string and status
  const requestBody = {
    page: typia.random<number & tags.Type<"int32"> & tags.Minimum<0>>(),
    limit: typia.random<number & tags.Type<"int32"> & tags.Minimum<0>>(),
    search: RandomGenerator.name(1),
    status: "active",
  } satisfies IShoppingMallCategory.IRequest;

  // 3. Call the categories index API with the request body
  const pageResult: IPageIShoppingMallCategory.ISummary =
    await api.functional.shoppingMall.adminUser.categories.index(connection, {
      body: requestBody,
    });
  typia.assert(pageResult);

  // 4. Validate pagination properties
  TestValidator.predicate(
    "pagination current page positive",
    pageResult.pagination.current >= 0,
  );
  TestValidator.predicate(
    "pagination limit positive",
    pageResult.pagination.limit >= 0,
  );
  TestValidator.predicate(
    "pagination record count non-negative",
    pageResult.pagination.records >= 0,
  );
  TestValidator.predicate(
    "pagination page count non-negative",
    pageResult.pagination.pages >= 0,
  );

  // 5. Validate that each category has required properties with correct formats
  for (const category of pageResult.data) {
    typia.assert(category);
    TestValidator.predicate(
      "category.id is valid uuid",
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        category.id,
      ),
    );
    TestValidator.predicate(
      "category.code is non-empty string",
      category.code.length > 0,
    );
    TestValidator.predicate(
      "category.name is non-empty string",
      category.name.length > 0,
    );
    TestValidator.predicate(
      "category.status is either active or inactive",
      category.status === "active" || category.status === "inactive",
    );
  }
}
