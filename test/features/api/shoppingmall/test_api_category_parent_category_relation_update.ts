import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallCategory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCategory";
import type { IShoppingMallCategoryRelations } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCategoryRelations";

/**
 * This E2E test validates the update operation for a parent category relation
 * in a shopping mall admin context. The test performs the steps:
 *
 * 1. Admin user sign-up for authenticated context.
 * 2. Creation of two categories (parent and child).
 * 3. Creation of initial parent category relation.
 * 4. Updating the relation by switching parent and child categories.
 * 5. Validating the updated relation content.
 */
export async function test_api_category_parent_category_relation_update(
  connection: api.IConnection,
) {
  // 1. Admin user sign-up to create admin authenticated context.
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: `${RandomGenerator.alphaNumeric(8)}@example.com`,
        password_hash: RandomGenerator.alphaNumeric(16),
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // 2. Create category A (parent category)
  const categoryA: IShoppingMallCategory =
    await api.functional.shoppingMall.adminUser.categories.create(connection, {
      body: {
        code: RandomGenerator.alphaNumeric(8),
        name: RandomGenerator.name(),
        status: "active",
        description: "Category A description",
      } satisfies IShoppingMallCategory.ICreate,
    });
  typia.assert(categoryA);

  // 3. Create category B (child category)
  const categoryB: IShoppingMallCategory =
    await api.functional.shoppingMall.adminUser.categories.create(connection, {
      body: {
        code: RandomGenerator.alphaNumeric(8),
        name: RandomGenerator.name(),
        status: "active",
        description: "Category B description",
      } satisfies IShoppingMallCategory.ICreate,
    });
  typia.assert(categoryB);

  // 4. Create initial parent category relation linking category A (parent) to category B (child)
  const relation: IShoppingMallCategoryRelations =
    await api.functional.shoppingMall.adminUser.categories.categoryRelations.parent.create(
      connection,
      {
        categoryId: categoryB.id,
        body: {
          parent_shopping_mall_category_id: categoryA.id,
          child_shopping_mall_category_id: categoryB.id,
        } satisfies IShoppingMallCategoryRelations.ICreate,
      },
    );
  typia.assert(relation);

  // 5. Update the parent category relation: switch parent to category B and child to category A
  const updateBody = {
    parent_shopping_mall_category_id: categoryB.id,
    child_shopping_mall_category_id: categoryA.id,
  } satisfies IShoppingMallCategoryRelations.IUpdate;

  const updatedRelation: IShoppingMallCategoryRelations =
    await api.functional.shoppingMall.adminUser.categories.categoryRelations.parent.update(
      connection,
      {
        categoryId: categoryB.id,
        relationId: relation.id,
        body: updateBody,
      },
    );
  typia.assert(updatedRelation);

  // 6. Validate updated relation
  TestValidator.equals(
    "relation id remains unchanged",
    updatedRelation.id,
    relation.id,
  );
  TestValidator.equals(
    "relation parent id updated",
    updatedRelation.parent_shopping_mall_category_id,
    categoryB.id,
  );
  TestValidator.equals(
    "relation child id updated",
    updatedRelation.child_shopping_mall_category_id,
    categoryA.id,
  );
}
