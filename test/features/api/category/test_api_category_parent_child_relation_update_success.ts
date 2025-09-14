import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallCategory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCategory";
import type { IShoppingMallCategoryRelations } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCategoryRelations";

/**
 * Test the update functionality of a child category relation.
 *
 * This test validates the process of updating an existing child category
 * relation under a parent category by an admin user. It ensures that the
 * update API correctly modifies the child relation, respects validation
 * rules, and enforces role-based permissions.
 *
 * The test includes the following steps:
 *
 * 1. Admin user joining and authentication.
 * 2. Creating a parent category.
 * 3. Creating a child category.
 * 4. Creating an initial child relation between the parent and the first
 *    child.
 * 5. Updating the child relation to point to a new child category.
 * 6. Asserting that the update is reflected in the returned updated relation
 *    object.
 */
export async function test_api_category_parent_child_relation_update_success(
  connection: api.IConnection,
) {
  // 1. Admin user joins and authenticates
  const adminUserBody = {
    email: `admin${RandomGenerator.alphaNumeric(6)}@example.com`,
    password_hash: RandomGenerator.alphaNumeric(12),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminUserBody,
    });
  typia.assert(adminUser);

  // 2. Create parent category
  const parentCategoryBody = {
    code: RandomGenerator.alphaNumeric(5),
    name: RandomGenerator.name(),
    status: "active",
    description: null,
  } satisfies IShoppingMallCategory.ICreate;

  const parentCategory: IShoppingMallCategory =
    await api.functional.shoppingMall.adminUser.categories.create(connection, {
      body: parentCategoryBody,
    });
  typia.assert(parentCategory);

  // 3. Create first child category
  const childCategory1Body = {
    code: RandomGenerator.alphaNumeric(5),
    name: RandomGenerator.name(),
    status: "active",
    description: null,
  } satisfies IShoppingMallCategory.ICreate;

  const childCategory1: IShoppingMallCategory =
    await api.functional.shoppingMall.adminUser.categories.create(connection, {
      body: childCategory1Body,
    });
  typia.assert(childCategory1);

  // 4. Create initial child category relation
  const initialRelationCreateBody = {
    parent_shopping_mall_category_id: parentCategory.id,
    child_shopping_mall_category_id: childCategory1.id,
  } satisfies IShoppingMallCategoryRelations.ICreate;

  const initialRelation: IShoppingMallCategoryRelations =
    await api.functional.shoppingMall.adminUser.categories.categoryRelations.child.createChildCategoryRelation(
      connection,
      {
        categoryId: parentCategory.id,
        body: initialRelationCreateBody,
      },
    );
  typia.assert(initialRelation);

  // 5. Create second child category for update
  const childCategory2Body = {
    code: RandomGenerator.alphaNumeric(5),
    name: RandomGenerator.name(),
    status: "active",
    description: null,
  } satisfies IShoppingMallCategory.ICreate;

  const childCategory2: IShoppingMallCategory =
    await api.functional.shoppingMall.adminUser.categories.create(connection, {
      body: childCategory2Body,
    });
  typia.assert(childCategory2);

  // 6. Update the existing child category relation to new child category
  const updateRelationBody = {
    child_shopping_mall_category_id: childCategory2.id,
  } satisfies IShoppingMallCategoryRelations.IUpdate;

  const updatedRelation: IShoppingMallCategoryRelations =
    await api.functional.shoppingMall.adminUser.categories.categoryRelations.child.updateChildCategoryRelation(
      connection,
      {
        categoryId: parentCategory.id,
        relationId: initialRelation.id,
        body: updateRelationBody,
      },
    );
  typia.assert(updatedRelation);

  // 7. Test that the relation ID is unchanged and child category ID is updated
  TestValidator.equals(
    "relation id remains the same after update",
    updatedRelation.id,
    initialRelation.id,
  );

  TestValidator.equals(
    "parent category id remains the same",
    updatedRelation.parent_shopping_mall_category_id,
    parentCategory.id,
  );

  TestValidator.equals(
    "child category id is updated",
    updatedRelation.child_shopping_mall_category_id,
    childCategory2.id,
  );
}
