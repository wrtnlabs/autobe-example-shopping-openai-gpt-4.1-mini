import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallCategory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCategory";
import type { IShoppingMallCategoryRelations } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCategoryRelations";

/**
 * This E2E test verifies the successful creation of a parent-child category
 * relation in the shopping mall administrative interface. The workflow
 * involves:
 *
 * 1. Creating an admin user and authenticating to obtain authorization.
 * 2. Creating a parent category with valid, realistic data.
 * 3. Creating a child category with valid, realistic data.
 * 4. Creating a child category relation that associates the child to the
 *    parent.
 * 5. Validating the response to confirm correct IDs and timestamps.
 *
 * Each creation call uses typia.random with explicit type parameters to
 * generate valid test data respecting schema constraints, and typia.assert
 * for runtime validation of returned data.
 *
 * TestValidator is used to assert the correctness of the category relation
 * fields specifically the IDs linking to the original created categories.
 */
export async function test_api_category_parent_child_relation_create_success(
  connection: api.IConnection,
) {
  // 1. Create and authenticate admin user
  const adminCreate = {
    email: `admin${RandomGenerator.alphaNumeric(6)}@example.com`,
    password_hash: RandomGenerator.alphaNumeric(12),
    nickname: RandomGenerator.name(2),
    full_name: RandomGenerator.name(3),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminCreate,
    });
  typia.assert(adminUser);

  // 2. Create parent category
  const parentCategoryCreate = {
    code: RandomGenerator.alphaNumeric(8),
    name: RandomGenerator.name(),
    status: "active",
    description: RandomGenerator.paragraph({ sentences: 3 }),
  } satisfies IShoppingMallCategory.ICreate;

  const parentCategory: IShoppingMallCategory =
    await api.functional.shoppingMall.adminUser.categories.create(connection, {
      body: parentCategoryCreate,
    });
  typia.assert(parentCategory);

  // 3. Create child category
  const childCategoryCreate = {
    code: RandomGenerator.alphaNumeric(8),
    name: RandomGenerator.name(),
    status: "active",
    description: RandomGenerator.paragraph({ sentences: 2 }),
  } satisfies IShoppingMallCategory.ICreate;

  const childCategory: IShoppingMallCategory =
    await api.functional.shoppingMall.adminUser.categories.create(connection, {
      body: childCategoryCreate,
    });
  typia.assert(childCategory);

  // 4. Create the child category relation under the parent category
  const relationCreate = {
    parent_shopping_mall_category_id: parentCategory.id,
    child_shopping_mall_category_id: childCategory.id,
  } satisfies IShoppingMallCategoryRelations.ICreate;

  const relation: IShoppingMallCategoryRelations =
    await api.functional.shoppingMall.adminUser.categories.categoryRelations.child.createChildCategoryRelation(
      connection,
      {
        categoryId: parentCategory.id,
        body: relationCreate,
      },
    );
  typia.assert(relation);

  // 5. Validate that the relation has correct parent and child category IDs
  TestValidator.equals(
    "parent category id should match",
    relation.parent_shopping_mall_category_id,
    parentCategory.id,
  );
  TestValidator.equals(
    "child category id should match",
    relation.child_shopping_mall_category_id,
    childCategory.id,
  );
}
