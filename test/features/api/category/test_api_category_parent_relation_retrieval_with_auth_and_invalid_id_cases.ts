import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallCategory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCategory";
import type { IShoppingMallCategoryRelations } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCategoryRelations";

/**
 * This test validates the retrieval of a specific parent category relation
 * by its ID in the context of an authenticated admin user. It includes the
 * creation of an admin user, creation of parent and child categories,
 * establishing the parent-child relation, and verifying the retrieval
 * operation returns the expected relation data.
 *
 * It also tests error handling by verifying that unauthorized access and
 * requests with invalid categoryId or relationId result in appropriate
 * errors.
 *
 * The test ensures strict compliance with DTO definitions and API
 * expectations, including format validation and proper authentication
 * flow.
 *
 * Steps:
 *
 * 1. Create an admin user (join operation) with valid data.
 * 2. Create two categories (parent and child) with realistic data.
 * 3. Create a parent category relation between these two categories.
 * 4. Retrieve the parent category relation by the IDs and validate the data.
 * 5. Attempt unauthorized retrieval and expect failure.
 * 6. Attempt retrieval with invalid categoryId and expect failure.
 * 7. Attempt retrieval with invalid relationId and expect failure.
 */
export async function test_api_category_parent_relation_retrieval_with_auth_and_invalid_id_cases(
  connection: api.IConnection,
) {
  // 1. Admin user join
  const adminUserEmail = typia.random<string & tags.Format<"email">>();
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: adminUserEmail,
        password_hash: RandomGenerator.alphaNumeric(32),
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // 2. Create parent category
  const parentCategoryCode = RandomGenerator.alphaNumeric(8);
  const parentCategoryName = RandomGenerator.name();
  const parentCategoryDescription = RandomGenerator.paragraph({ sentences: 3 });
  const parentCategory: IShoppingMallCategory =
    await api.functional.shoppingMall.adminUser.categories.create(connection, {
      body: {
        code: parentCategoryCode,
        name: parentCategoryName,
        status: "active",
        description: parentCategoryDescription,
      } satisfies IShoppingMallCategory.ICreate,
    });
  typia.assert(parentCategory);

  // 3. Create child category
  const childCategoryCode = RandomGenerator.alphaNumeric(8);
  const childCategoryName = RandomGenerator.name();
  const childCategoryDescription = RandomGenerator.paragraph({ sentences: 3 });
  const childCategory: IShoppingMallCategory =
    await api.functional.shoppingMall.adminUser.categories.create(connection, {
      body: {
        code: childCategoryCode,
        name: childCategoryName,
        status: "active",
        description: childCategoryDescription,
      } satisfies IShoppingMallCategory.ICreate,
    });
  typia.assert(childCategory);

  // 4. Create parent category relation
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

  // 5. Retrieve the parent category relation by category and relation IDs
  const fetchedRelation: IShoppingMallCategoryRelations =
    await api.functional.shoppingMall.adminUser.categories.categoryRelations.parent.at(
      connection,
      {
        categoryId: childCategory.id,
        relationId: categoryRelation.id,
      },
    );
  typia.assert(fetchedRelation);

  TestValidator.equals(
    "category relation id matches",
    fetchedRelation.id,
    categoryRelation.id,
  );
  TestValidator.equals(
    "parent category id matches",
    fetchedRelation.parent_shopping_mall_category_id,
    parentCategory.id,
  );
  TestValidator.equals(
    "child category id matches",
    fetchedRelation.child_shopping_mall_category_id,
    childCategory.id,
  );

  // 6. Test unauthorized access - create a fresh connection with empty headers
  const unauthenticatedConnection: api.IConnection = {
    ...connection,
    headers: {},
  };
  await TestValidator.error(
    "unauthorized access to category relation query should fail",
    async () => {
      await api.functional.shoppingMall.adminUser.categories.categoryRelations.parent.at(
        unauthenticatedConnection,
        {
          categoryId: childCategory.id,
          relationId: categoryRelation.id,
        },
      );
    },
  );

  // 7. Test invalid categoryId
  await TestValidator.error(
    "fetching with invalid categoryId should fail",
    async () => {
      await api.functional.shoppingMall.adminUser.categories.categoryRelations.parent.at(
        connection,
        {
          categoryId: typia.random<string & tags.Format<"uuid">>(), // random UUID not existing
          relationId: categoryRelation.id,
        },
      );
    },
  );

  // 8. Test invalid relationId
  await TestValidator.error(
    "fetching with invalid relationId should fail",
    async () => {
      await api.functional.shoppingMall.adminUser.categories.categoryRelations.parent.at(
        connection,
        {
          categoryId: childCategory.id,
          relationId: typia.random<string & tags.Format<"uuid">>(), // random UUID not existing
        },
      );
    },
  );
}
