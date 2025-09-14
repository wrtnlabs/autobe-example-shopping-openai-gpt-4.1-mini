import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallCategory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCategory";
import type { IShoppingMallCategoryRelations } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCategoryRelations";

/**
 * This test verifies the retrieval of a child category relation for a
 * parent category in a shopping mall admin system. The test involves the
 * full workflow of authenticating as an admin user, creating a parent
 * category and a child category, creating a category relation link from
 * parent to child, then retrieving the specific child relation by its ID to
 * confirm correctness.
 *
 * The test validates proper authorization, creation, and retrieval
 * behaviors for admin category management scenarios. All required fields
 * are included in creating users, categories, relations, and all response
 * data is asserted with typia.assert. The test ensures business rules
 * related to hierarchical category relationships are upheld and access
 * control for admin users is respected.
 *
 * Step-by-step process:
 *
 * 1. Authenticate by creating a new admin user account using the join API
 * 2. Create a parent category with realistic code, name, and status
 * 3. Create a child category with realistic code, name, and status
 * 4. Create a child category relation linking the parent and child categories
 * 5. Retrieve the child category relation by the specific relation ID
 * 6. Validate that the retrieved relation matches the created one in all
 *    properties
 * 7. Validate typia type assertion for all API responses
 * 8. Validate business logic using TestValidator.equals for matching IDs and
 *    fields
 *
 * This test covers full authorization, resource creation, relationship
 * linking, and retrieval for the admin user domain in shopping mall
 * category management.
 */
export async function test_api_category_parent_child_relation_retrieve_success(
  connection: api.IConnection,
) {
  // 1. Authenticate by creating a new admin user account
  const adminUserEmail = typia.random<string & tags.Format<"email">>();
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: adminUserEmail,
        password_hash: RandomGenerator.alphaNumeric(20),
        nickname: RandomGenerator.name(2),
        full_name: RandomGenerator.name(3),
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // 2. Create a parent category
  const parentCategoryCode = RandomGenerator.alphaNumeric(6);
  const parentCategoryName = RandomGenerator.name(1);
  const parentCategoryStatus = "active";
  const parentCategory: IShoppingMallCategory =
    await api.functional.shoppingMall.adminUser.categories.create(connection, {
      body: {
        code: parentCategoryCode,
        name: parentCategoryName,
        status: parentCategoryStatus,
        description: null,
      } satisfies IShoppingMallCategory.ICreate,
    });
  typia.assert(parentCategory);

  // 3. Create a child category
  const childCategoryCode = RandomGenerator.alphaNumeric(6);
  const childCategoryName = RandomGenerator.name(1);
  const childCategoryStatus = "active";
  const childCategory: IShoppingMallCategory =
    await api.functional.shoppingMall.adminUser.categories.create(connection, {
      body: {
        code: childCategoryCode,
        name: childCategoryName,
        status: childCategoryStatus,
        description: null,
      } satisfies IShoppingMallCategory.ICreate,
    });
  typia.assert(childCategory);

  // 4. Create a child category relation linking parent and child
  const relation: IShoppingMallCategoryRelations =
    await api.functional.shoppingMall.adminUser.categories.categoryRelations.child.createChildCategoryRelation(
      connection,
      {
        categoryId: parentCategory.id,
        body: {
          parent_shopping_mall_category_id: parentCategory.id,
          child_shopping_mall_category_id: childCategory.id,
        } satisfies IShoppingMallCategoryRelations.ICreate,
      },
    );
  typia.assert(relation);

  // 5. Retrieve the specific child category relation
  const retrievedRelation: IShoppingMallCategoryRelations =
    await api.functional.shoppingMall.adminUser.categories.categoryRelations.child.atChild(
      connection,
      {
        categoryId: parentCategory.id,
        relationId: relation.id,
      },
    );
  typia.assert(retrievedRelation);

  // 6. Validate retrieved relation matches created relation
  TestValidator.equals(
    "relation id should match",
    retrievedRelation.id,
    relation.id,
  );
  TestValidator.equals(
    "parent category id should match",
    retrievedRelation.parent_shopping_mall_category_id,
    parentCategory.id,
  );
  TestValidator.equals(
    "child category id should match",
    retrievedRelation.child_shopping_mall_category_id,
    childCategory.id,
  );
}
