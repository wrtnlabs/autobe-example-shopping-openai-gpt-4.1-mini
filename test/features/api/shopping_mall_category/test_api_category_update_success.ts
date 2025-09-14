import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallCategory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCategory";

/**
 * Test updating an existing category by ID with valid changes on code, name,
 * description, and status. Verify the updated entity matches the input and
 * timestamps are correctly updated. Ensure that proper authorization (admin
 * user) is enforced. Test error scenarios such as invalid IDs and duplicates.
 */
export async function test_api_category_update_success(
  connection: api.IConnection,
) {
  // 1. Create admin user and authenticate
  const adminUserCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(16),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    status: "active" as const,
  } satisfies IShoppingMallAdminUser.ICreate;
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminUserCreateBody,
    });
  typia.assert(adminUser);

  // 2. Prepare update body for category
  const categoryUpdateBody1 = {
    code: RandomGenerator.alphaNumeric(8),
    name: RandomGenerator.name(),
    description: RandomGenerator.content({ paragraphs: 1 }),
    status: "active" as const,
  } satisfies IShoppingMallCategory.IUpdate;

  // 3. Perform category update as an existing UUID (simulate)
  const categoryId: string & tags.Format<"uuid"> = typia.random<
    string & tags.Format<"uuid">
  >();
  const updatedCategory: IShoppingMallCategory =
    await api.functional.shoppingMall.adminUser.categories.update(connection, {
      categoryId,
      body: categoryUpdateBody1,
    });
  typia.assert(updatedCategory);

  // 4. Validate returned category
  TestValidator.equals(
    "category id should match requested categoryId",
    updatedCategory.id,
    categoryId,
  );
  TestValidator.equals(
    "category code should be updated",
    updatedCategory.code,
    categoryUpdateBody1.code,
  );
  TestValidator.equals(
    "category name should be updated",
    updatedCategory.name,
    categoryUpdateBody1.name,
  );
  TestValidator.equals(
    "category description should be updated",
    updatedCategory.description ?? null,
    categoryUpdateBody1.description ?? null,
  );
  TestValidator.equals(
    "category status should be updated",
    updatedCategory.status,
    categoryUpdateBody1.status,
  );

  // Validate date-time strings and updated_at >= created_at
  const createdAt = updatedCategory.created_at;
  const updatedAt = updatedCategory.updated_at;

  typia.assert<string & tags.Format<"date-time">>(createdAt);
  typia.assert<string & tags.Format<"date-time">>(updatedAt);

  TestValidator.predicate(
    "updated_at should be >= created_at",
    new Date(updatedAt) >= new Date(createdAt),
  );

  // 5. Test error scenario: update with invalid duplicate code
  const duplicateCodeUpdateBody = {
    code: updatedCategory.code,
  } satisfies IShoppingMallCategory.IUpdate;

  await TestValidator.error(
    "should throw on duplicate category code",
    async () => {
      await api.functional.shoppingMall.adminUser.categories.update(
        connection,
        {
          categoryId: typia.random<string & tags.Format<"uuid">>(),
          body: duplicateCodeUpdateBody,
        },
      );
    },
  );

  // 6. Test error scenario: update with invalid categoryId
  const invalidCategoryId: string & tags.Format<"uuid"> = typia.random<
    string & tags.Format<"uuid">
  >();
  const updateBodyForInvalid = {
    name: RandomGenerator.name(),
  } satisfies IShoppingMallCategory.IUpdate;

  await TestValidator.error("should throw on invalid categoryId", async () => {
    await api.functional.shoppingMall.adminUser.categories.update(connection, {
      categoryId: invalidCategoryId,
      body: updateBodyForInvalid,
    });
  });
}
