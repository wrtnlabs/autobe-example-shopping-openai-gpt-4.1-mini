import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallCategoryRelations } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallCategoryRelations";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallCategory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCategory";
import type { IShoppingMallCategoryRelations } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCategoryRelations";

/**
 * Test listing child category relations for a given parent category in a
 * shopping mall administration context.
 *
 * The test begins with creating an admin user to establish authentication and
 * authorization. It then creates a parent category and multiple child
 * categories, all with valid and realistic data. Next, it creates child
 * category relations that link the parent category to each created child
 * category, ensuring correct parent-child relationships. Finally, the test
 * retrieves the paginated list of child category relations for the parent
 * category and verifies that the retrieved data matches the created relations
 * in count and content.
 *
 * Each API call is awaited and validated for type correctness. The test uses
 * explicit null for nullable fields, follows schema constraints, and uses
 * descriptive TestValidator assertions to verify pagination and data
 * integrity.
 */
export async function test_api_category_child_category_relation_list_pagination(
  connection: api.IConnection,
) {
  // Step 1: Admin user join (authentication)
  const adminUserCreate = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(16),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminUserCreate,
    });
  typia.assert(adminUser);

  // Step 2: Create parent category
  const parentCategoryCreate = {
    code: RandomGenerator.alphaNumeric(6),
    name: RandomGenerator.name(),
    status: "active",
    description: null,
  } satisfies IShoppingMallCategory.ICreate;

  const parentCategory: IShoppingMallCategory =
    await api.functional.shoppingMall.adminUser.categories.create(connection, {
      body: parentCategoryCreate,
    });
  typia.assert(parentCategory);

  // Step 3: Create multiple child categories
  const childCategories: IShoppingMallCategory[] = [];
  const childCount = 3;
  for (let i = 0; i < childCount; i++) {
    const childCategoryCreate = {
      code: RandomGenerator.alphaNumeric(6),
      name: RandomGenerator.name(),
      status: "active",
      description: null,
    } satisfies IShoppingMallCategory.ICreate;

    const childCategory: IShoppingMallCategory =
      await api.functional.shoppingMall.adminUser.categories.create(
        connection,
        { body: childCategoryCreate },
      );
    typia.assert(childCategory);
    childCategories.push(childCategory);
  }

  // Step 4: Create child category relations linking parent to each child
  const createdRelations: IShoppingMallCategoryRelations[] = [];
  for (const child of childCategories) {
    const createRelationBody = {
      parent_shopping_mall_category_id: parentCategory.id,
      child_shopping_mall_category_id: child.id,
    } satisfies IShoppingMallCategoryRelations.ICreate;

    const relation: IShoppingMallCategoryRelations =
      await api.functional.shoppingMall.adminUser.categories.categoryRelations.child.createChildCategoryRelation(
        connection,
        { categoryId: parentCategory.id, body: createRelationBody },
      );
    typia.assert(relation);
    createdRelations.push(relation);
  }

  // Step 5: Retrieve paginated list of child category relations for the parent
  const requestBody = {
    parent_shopping_mall_category_id: parentCategory.id,
    child_shopping_mall_category_id: null,
    categoryId: null,
    deleted_at: false,
    page: 1,
    limit: 10,
    sort: null,
    created_at_from: null,
    created_at_to: null,
    updated_at_from: null,
    updated_at_to: null,
  } satisfies IShoppingMallCategoryRelations.IRequest;

  const relationsPage: IPageIShoppingMallCategoryRelations.ISummary =
    await api.functional.shoppingMall.adminUser.categories.categoryRelations.child.indexChild(
      connection,
      { categoryId: parentCategory.id, body: requestBody },
    );
  typia.assert(relationsPage);

  // Step 6: Validate pagination and that created relations appear
  TestValidator.predicate(
    "pagination current page equals 1",
    relationsPage.pagination.current === 1,
  );
  TestValidator.predicate(
    "pagination limit equals 10",
    relationsPage.pagination.limit === 10,
  );
  TestValidator.predicate(
    "pagination total records meets or exceeds created",
    relationsPage.pagination.records >= createdRelations.length,
  );

  for (const created of createdRelations) {
    TestValidator.predicate(
      `relation with id ${created.id} is present in paginated results`,
      relationsPage.data.some((r) => r.id === created.id),
    );
  }

  for (const relation of relationsPage.data) {
    TestValidator.equals(
      "parent category id matches",
      relation.parent_shopping_mall_category_id,
      parentCategory.id,
    );
  }
}
