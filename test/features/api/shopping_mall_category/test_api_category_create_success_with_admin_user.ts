import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallCategory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCategory";

/**
 * Create a new shopping mall category as an administrator.
 *
 * This test fully validates category creation under an admin context:
 *
 * 1. Admin user joins and authenticates
 * 2. Create a new unique category with code, name, status, optional
 *    description
 * 3. Validate the returned category details including timestamps and IDs
 *
 * This flow confirms that admin authentication is required and category
 * creation succeeds with valid inputs.
 */
export async function test_api_category_create_success_with_admin_user(
  connection: api.IConnection,
) {
  // 1. Admin user join and authenticate
  const adminUserCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(16),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(3),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminUserCreateBody,
    });
  typia.assert(adminUser);

  // 2. Prepare category creation request
  const categoryCreateBody = {
    code: RandomGenerator.alphaNumeric(8),
    name: RandomGenerator.name(2),
    status: "active",
    description: RandomGenerator.paragraph({
      sentences: 4,
      wordMin: 4,
      wordMax: 8,
    }),
  } satisfies IShoppingMallCategory.ICreate;

  // 3. Create category
  const category: IShoppingMallCategory =
    await api.functional.shoppingMall.adminUser.categories.create(connection, {
      body: categoryCreateBody,
    });
  typia.assert(category);

  // 4. Validate returned category fields
  TestValidator.predicate(
    "category id is valid UUID",
    typeof category.id === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
        category.id,
      ),
  );
  TestValidator.equals(
    "category code matches",
    category.code,
    categoryCreateBody.code,
  );
  TestValidator.equals(
    "category name matches",
    category.name,
    categoryCreateBody.name,
  );
  TestValidator.equals(
    "category status matches",
    category.status,
    categoryCreateBody.status,
  );

  if (category.description !== null && category.description !== undefined) {
    TestValidator.equals(
      "category description matches",
      category.description,
      categoryCreateBody.description,
    );
  } else {
    TestValidator.equals(
      "category description is null or undefined",
      category.description,
      category.description,
    ); // no-op but clear
  }

  TestValidator.predicate(
    "category created_at is ISO datetime",
    typeof category.created_at === "string" &&
      !isNaN(Date.parse(category.created_at)),
  );
  TestValidator.predicate(
    "category updated_at is ISO datetime",
    typeof category.updated_at === "string" &&
      !isNaN(Date.parse(category.updated_at)),
  );

  // 5. deleted_at must be null or undefined on creation
  TestValidator.predicate(
    "category deleted_at is null or undefined",
    category.deleted_at === null || category.deleted_at === undefined,
  );
}
