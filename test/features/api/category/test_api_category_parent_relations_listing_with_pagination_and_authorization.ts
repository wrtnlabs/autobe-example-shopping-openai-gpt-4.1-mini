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

export async function test_api_category_parent_relations_listing_with_pagination_and_authorization(
  connection: api.IConnection,
) {
  // 1. Admin user signs up to authenticate
  const adminUserEmail: string = typia.random<string & tags.Format<"email">>();
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: adminUserEmail,
        password_hash: "hashed_password",
        nickname: "AdminUser",
        full_name: "Admin User",
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // 2. Create several categories
  const categoryCount = 5;
  const categories: IShoppingMallCategory[] = [];
  for (let i = 0; i < categoryCount; i++) {
    const createCategoryBody = {
      code: `cat_code_${i}_${RandomGenerator.alphaNumeric(4)}`,
      name: `Category ${i}`,
      status: "active",
      description: i % 2 === 0 ? `Description for category ${i}` : null,
    } satisfies IShoppingMallCategory.ICreate;
    const createdCategory =
      await api.functional.shoppingMall.adminUser.categories.create(
        connection,
        {
          body: createCategoryBody,
        },
      );
    typia.assert(createdCategory);
    categories.push(createdCategory);
  }

  // 3. Create parent relations, choosing one category as child
  const childCategory = categories[categoryCount - 1];
  const parentCategories = categories.slice(0, categoryCount - 1);

  // Create multiple parent-child relations for the selected child category
  for (const parentCat of parentCategories) {
    const relationCreateBody = {
      parent_shopping_mall_category_id: parentCat.id,
      child_shopping_mall_category_id: childCategory.id,
    } satisfies IShoppingMallCategoryRelations.ICreate;

    const relation =
      await api.functional.shoppingMall.adminUser.categories.categoryRelations.parent.create(
        connection,
        {
          categoryId: childCategory.id,
          body: relationCreateBody,
        },
      );
    typia.assert(relation);
  }

  // 4. List parent relations with pagination - expect to get all parents in pages
  const paginationRequestBody = {
    page: 1,
    limit: 10,
    sort: "created_at",
  } satisfies IShoppingMallCategoryRelations.IRequest;
  const parentRelationsPage =
    await api.functional.shoppingMall.adminUser.categories.categoryRelations.parent.index(
      connection,
      {
        categoryId: childCategory.id,
        body: paginationRequestBody,
      },
    );
  typia.assert(parentRelationsPage);

  // Validate pagination meta
  TestValidator.predicate(
    "pagination has current page 1",
    parentRelationsPage.pagination.current === 1,
  );
  TestValidator.predicate(
    "pagination limit 10",
    parentRelationsPage.pagination.limit === 10,
  );
  TestValidator.predicate(
    "pagination records match number of parent relations",
    parentRelationsPage.pagination.records === parentCategories.length,
  );

  // Validate each relation refers to correct parent and child
  for (const rel of parentRelationsPage.data) {
    TestValidator.predicate(
      "relation child matches childCategory",
      rel.child_shopping_mall_category_id === childCategory.id,
    );
    // parent id should be among the known parents
    TestValidator.predicate(
      "relation parent exists in parentCategories",
      parentCategories.some(
        (parent) => parent.id === rel.parent_shopping_mall_category_id,
      ),
    );
  }

  // 5. Try unauthorized access by using a fresh connection without admin login
  const unauthenticatedConnection = { ...connection, headers: {} };
  await TestValidator.error("unauthorized access rejected", async () => {
    await api.functional.shoppingMall.adminUser.categories.categoryRelations.parent.index(
      unauthenticatedConnection,
      {
        categoryId: childCategory.id,
        body: paginationRequestBody,
      },
    );
  });

  // 6. Try listing with invalid categoryId
  await TestValidator.error("invalid category ID rejected", async () => {
    let invalidCategoryId: string;
    do {
      invalidCategoryId = typia.random<string & tags.Format<"uuid">>();
    } while (categories.some((c) => c.id === invalidCategoryId));
    await api.functional.shoppingMall.adminUser.categories.categoryRelations.parent.index(
      connection,
      {
        categoryId: invalidCategoryId,
        body: paginationRequestBody,
      },
    );
  });
}
