import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallCategory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCategory";
import type { IShoppingMallCategoryRelations } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCategoryRelations";

export async function test_api_category_parent_category_relation_creation(
  connection: api.IConnection,
) {
  // 1. Admin user join to authenticate as adminUser
  const adminUserCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(16),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminUserCreateBody,
    });
  typia.assert(adminUser);

  // 2. Create parent category
  const parentCategoryCreateBody = {
    code: RandomGenerator.alphaNumeric(8),
    name: RandomGenerator.name(),
    status: "active",
    description: RandomGenerator.paragraph({
      sentences: 3,
      wordMin: 5,
      wordMax: 10,
    }),
  } satisfies IShoppingMallCategory.ICreate;

  const parentCategory: IShoppingMallCategory =
    await api.functional.shoppingMall.adminUser.categories.create(connection, {
      body: parentCategoryCreateBody,
    });
  typia.assert(parentCategory);

  // 3. Create child category
  const childCategoryCreateBody = {
    code: RandomGenerator.alphaNumeric(8),
    name: RandomGenerator.name(),
    status: "active",
    description: RandomGenerator.paragraph({
      sentences: 3,
      wordMin: 5,
      wordMax: 10,
    }),
  } satisfies IShoppingMallCategory.ICreate;

  const childCategory: IShoppingMallCategory =
    await api.functional.shoppingMall.adminUser.categories.create(connection, {
      body: childCategoryCreateBody,
    });
  typia.assert(childCategory);

  // 4. Create parent category relation linking the parent to the child
  const categoryRelationCreateBody = {
    parent_shopping_mall_category_id: parentCategory.id,
    child_shopping_mall_category_id: childCategory.id,
  } satisfies IShoppingMallCategoryRelations.ICreate;

  const categoryRelation: IShoppingMallCategoryRelations =
    await api.functional.shoppingMall.adminUser.categories.categoryRelations.parent.create(
      connection,
      {
        categoryId: childCategory.id,
        body: categoryRelationCreateBody,
      },
    );
  typia.assert(categoryRelation);

  // 5. Validate the relation fields match expected parent and child ids
  TestValidator.equals(
    "categoryRelation parent_shopping_mall_category_id",
    categoryRelation.parent_shopping_mall_category_id,
    parentCategory.id,
  );
  TestValidator.equals(
    "categoryRelation child_shopping_mall_category_id",
    categoryRelation.child_shopping_mall_category_id,
    childCategory.id,
  );
}
