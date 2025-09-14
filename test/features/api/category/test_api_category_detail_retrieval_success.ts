import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallCategory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCategory";

/**
 * Test retrieval of a specific category's complete detail by categoryId.
 *
 * This test verifies that an authorized admin user can obtain all expected
 * fields of a product category including id, code, name, status,
 * description, timestamps and checks proper error handling for invalid or
 * non-existing IDs.
 *
 * The workflow includes:
 *
 * 1. Admin user creation and authentication via join API.
 * 2. Retrieval of category details using a valid UUID.
 * 3. Validation of response properties.
 * 4. Negative test for non-existent category.
 *
 * This ensures that the admin category detail retrieval endpoint behaves as
 * expected under authorized and unauthorized or invalid conditions.
 */
export async function test_api_category_detail_retrieval_success(
  connection: api.IConnection,
) {
  // 1. Admin user creation and authentication
  const adminUserCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(12),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminUserCreateBody,
    });
  typia.assert(adminUser);

  // 2. Prepare a valid categoryId (simulate creation by using a random UUID)
  // This UUID simulates an existing category ID for retrieval test
  const validCategoryId: string & tags.Format<"uuid"> = typia.random<
    string & tags.Format<"uuid">
  >();

  // 3. Retrieve the category detail by valid categoryId
  const categoryDetail: IShoppingMallCategory =
    await api.functional.shoppingMall.adminUser.categories.at(connection, {
      categoryId: validCategoryId,
    });
  typia.assert(categoryDetail);

  // 4. Verify properties existence and correctness
  TestValidator.predicate(
    "categoryDetail.id is string",
    typeof categoryDetail.id === "string",
  );
  TestValidator.equals(
    "categoryDetail.id equals categoryId",
    categoryDetail.id,
    validCategoryId,
  );
  TestValidator.predicate(
    "categoryDetail.code is string",
    typeof categoryDetail.code === "string",
  );
  TestValidator.predicate(
    "categoryDetail.name is string",
    typeof categoryDetail.name === "string",
  );
  TestValidator.predicate(
    "categoryDetail.status is string",
    typeof categoryDetail.status === "string",
  );
  TestValidator.predicate(
    "categoryDetail.created_at is string",
    typeof categoryDetail.created_at === "string",
  );
  TestValidator.predicate(
    "categoryDetail.updated_at is string",
    typeof categoryDetail.updated_at === "string",
  );

  // description and deleted_at are nullable, check presence (either string or null)
  TestValidator.predicate(
    "categoryDetail.description is string or null or undefined",
    typeof categoryDetail.description === "string" ||
      categoryDetail.description === null ||
      categoryDetail.description === undefined,
  );
  TestValidator.predicate(
    "categoryDetail.deleted_at is string or null or undefined",
    typeof categoryDetail.deleted_at === "string" ||
      categoryDetail.deleted_at === null ||
      categoryDetail.deleted_at === undefined,
  );

  // 5. Negative test: retrieve category with non-existing categoryId should error
  const nonExistingCategoryId: string & tags.Format<"uuid"> = typia.random<
    string & tags.Format<"uuid">
  >();
  await TestValidator.error(
    "retrieve non-existing category should fail",
    async () => {
      await api.functional.shoppingMall.adminUser.categories.at(connection, {
        categoryId: nonExistingCategoryId,
      });
    },
  );
}
