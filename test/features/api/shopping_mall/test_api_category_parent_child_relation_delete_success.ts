import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallCategory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCategory";
import type { IShoppingMallCategoryRelations } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCategoryRelations";

export async function test_api_category_parent_child_relation_delete_success(
  connection: api.IConnection,
) {
  // 1. Admin user join
  const adminUserBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: "secret_hash",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminUserBody,
    });
  typia.assert(adminUser);

  // 2. Create parent category
  const parentCategoryBody = {
    code: RandomGenerator.alphaNumeric(8),
    name: RandomGenerator.name(),
    status: "active",
    description: RandomGenerator.paragraph(),
  } satisfies IShoppingMallCategory.ICreate;
  const parentCategory: IShoppingMallCategory =
    await api.functional.shoppingMall.adminUser.categories.create(connection, {
      body: parentCategoryBody,
    });
  typia.assert(parentCategory);

  // 3. Create child category
  const childCategoryBody = {
    code: RandomGenerator.alphaNumeric(8),
    name: RandomGenerator.name(),
    status: "active",
    description: RandomGenerator.paragraph(),
  } satisfies IShoppingMallCategory.ICreate;
  const childCategory: IShoppingMallCategory =
    await api.functional.shoppingMall.adminUser.categories.create(connection, {
      body: childCategoryBody,
    });
  typia.assert(childCategory);

  // 4. Create child category relation
  const childRelationCreateBody = {
    parent_shopping_mall_category_id: parentCategory.id,
    child_shopping_mall_category_id: childCategory.id,
  } satisfies IShoppingMallCategoryRelations.ICreate;
  const childRelation: IShoppingMallCategoryRelations =
    await api.functional.shoppingMall.adminUser.categories.categoryRelations.child.createChildCategoryRelation(
      connection,
      {
        categoryId: parentCategory.id,
        body: childRelationCreateBody,
      },
    );
  typia.assert(childRelation);

  // 5. Delete the created child category relation
  await api.functional.shoppingMall.adminUser.categories.categoryRelations.child.eraseChildCategoryRelation(
    connection,
    {
      categoryId: parentCategory.id,
      relationId: childRelation.id,
    },
  );

  // Verification: successful deletion leads here without exception
  TestValidator.predicate("child category relation deletion succeeds", true);
}
