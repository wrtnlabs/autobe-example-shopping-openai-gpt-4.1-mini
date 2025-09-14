import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallCategory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCategory";
import type { IShoppingMallCategoryRelations } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCategoryRelations";

/**
 * E2E test for deleting a parent category relation.
 *
 * This test covers the complete workflow:
 *
 * 1. Creating an admin user via join
 * 2. Creating parent and child categories with required info
 * 3. Creating the parent-child category relation
 * 4. Deleting the parent category relation by ID
 * 5. Validating deletion completes successfully (no content)
 */
export async function test_api_category_parent_category_relation_deletion(
  connection: api.IConnection,
) {
  // 1. Admin user creation (join)
  const adminCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(16),
    nickname: RandomGenerator.name(2),
    full_name: RandomGenerator.name(2),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminCreateBody,
    });
  typia.assert(adminUser);

  // 2. Create parent category
  const parentCategoryBody = {
    code: RandomGenerator.alphaNumeric(8),
    name: RandomGenerator.name(2),
    status: "active",
  } satisfies IShoppingMallCategory.ICreate;

  const parentCategory: IShoppingMallCategory =
    await api.functional.shoppingMall.adminUser.categories.create(connection, {
      body: parentCategoryBody,
    });
  typia.assert(parentCategory);

  // 3. Create child category
  const childCategoryBody = {
    code: RandomGenerator.alphaNumeric(8),
    name: RandomGenerator.name(2),
    status: "active",
  } satisfies IShoppingMallCategory.ICreate;

  const childCategory: IShoppingMallCategory =
    await api.functional.shoppingMall.adminUser.categories.create(connection, {
      body: childCategoryBody,
    });
  typia.assert(childCategory);

  // 4. Create parent category relation linking parent and child
  const relationCreateBody = {
    parent_shopping_mall_category_id: parentCategory.id,
    child_shopping_mall_category_id: childCategory.id,
  } satisfies IShoppingMallCategoryRelations.ICreate;

  const categoryRelation: IShoppingMallCategoryRelations =
    await api.functional.shoppingMall.adminUser.categories.categoryRelations.parent.create(
      connection,
      {
        categoryId: childCategory.id,
        body: relationCreateBody,
      },
    );
  typia.assert(categoryRelation);

  // Validate relation links correct categories
  TestValidator.equals(
    "parent category id matches",
    categoryRelation.parent_shopping_mall_category_id,
    parentCategory.id,
  );
  TestValidator.equals(
    "child category id matches",
    categoryRelation.child_shopping_mall_category_id,
    childCategory.id,
  );

  // 5. Delete the parent category relation
  // Note: returns void
  await api.functional.shoppingMall.adminUser.categories.categoryRelations.parent.erase(
    connection,
    {
      categoryId: childCategory.id,
      relationId: categoryRelation.id,
    },
  );

  // No response to assert; assume success if no exception
}
