import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallCategory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCategory";

/**
 * Validates admin user category update scenarios.
 *
 * This test covers the following workflows:
 *
 * 1. Admin user registration through join API to obtain credentials.
 * 2. Creation of a product category to obtain a valid categoryId.
 * 3. Successful update of the category with new name, description, and status.
 * 4. Verification of updated properties accuracy.
 * 5. Attempted unauthorized update by a non-admin user expecting failure.
 * 6. Attempted update with a non-existent categoryId expecting failure.
 *
 * The test confirms that only authorized admin users can update categories,
 * data integrity after updates, and proper error handling during invalid
 * accesses.
 */
export async function test_api_category_update_success_and_authorization_failures(
  connection: api.IConnection,
) {
  // 1. Register a new admin user
  const adminUserEmail: string = typia.random<string & tags.Format<"email">>();
  const adminUserPasswordHash = RandomGenerator.alphaNumeric(32); // Simulate password hash
  const adminUserNickname = RandomGenerator.name();
  const adminUserFullName = RandomGenerator.name(2);
  const adminUserStatus = "active";

  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: adminUserEmail,
        password_hash: adminUserPasswordHash,
        nickname: adminUserNickname,
        full_name: adminUserFullName,
        status: adminUserStatus,
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // 2. Create a new category using admin authentication
  //    The connection headers are automatically updated by the SDK after join
  //    so no manual header manipulation is needed.
  const categoryCode = RandomGenerator.alphaNumeric(10);
  const categoryName = RandomGenerator.paragraph({
    sentences: 3,
    wordMin: 4,
    wordMax: 10,
  });
  const categoryStatus = "active";
  const categoryDescription = RandomGenerator.paragraph({ sentences: 8 });

  const createdCategory: IShoppingMallCategory =
    await api.functional.shoppingMall.adminUser.categories.create(connection, {
      body: {
        code: categoryCode,
        name: categoryName,
        status: categoryStatus,
        description: categoryDescription,
      } satisfies IShoppingMallCategory.ICreate,
    });
  typia.assert(createdCategory);

  // 3. Perform successful update of the created category
  const updatedCategoryName = RandomGenerator.paragraph({
    sentences: 4,
    wordMin: 5,
    wordMax: 12,
  });
  const updatedCategoryDescription = RandomGenerator.paragraph({
    sentences: 6,
    wordMin: 7,
    wordMax: 15,
  });
  const updatedCategoryStatus = "inactive"; // Use allowed value different from original

  const updatedCategory: IShoppingMallCategory =
    await api.functional.shoppingMall.adminUser.categories.update(connection, {
      categoryId: createdCategory.id,
      body: {
        name: updatedCategoryName,
        description: updatedCategoryDescription,
        status: updatedCategoryStatus,
      } satisfies IShoppingMallCategory.IUpdate,
    });
  typia.assert(updatedCategory);

  // Verify that the updated category has the new properties matching the update request
  TestValidator.equals(
    "category id unchanged after update",
    updatedCategory.id,
    createdCategory.id,
  );
  TestValidator.equals(
    "category name updated",
    updatedCategory.name,
    updatedCategoryName,
  );
  TestValidator.equals(
    "category description updated",
    updatedCategory.description,
    updatedCategoryDescription,
  );
  TestValidator.equals(
    "category status updated",
    updatedCategory.status,
    updatedCategoryStatus,
  );

  // 4. Attempt unauthorized update: simulate a non-admin user by joining a new user without updating admin token
  //    Use a new connection object so authorization is absent or invalid.
  const unauthenticatedConnection: api.IConnection = {
    ...connection,
    headers: {},
  };

  // Create a normal user who is not admin by joining adminUser endpoint and clearing authorization
  // We simulate this by creating a new connection without admin token header
  const nonAdminUserEmail: string = typia.random<
    string & tags.Format<"email">
  >();
  const nonAdminUserPasswordHash = RandomGenerator.alphaNumeric(32);
  const nonAdminUserNickname = RandomGenerator.name();
  const nonAdminUserFullName = RandomGenerator.name(2);
  const nonAdminUserStatus = "active";

  // Although joining again sets token header on original connection, here we won't use it for update to simulate unauthorized
  await api.functional.auth.adminUser.join(unauthenticatedConnection, {
    body: {
      email: nonAdminUserEmail,
      password_hash: nonAdminUserPasswordHash,
      nickname: nonAdminUserNickname,
      full_name: nonAdminUserFullName,
      status: nonAdminUserStatus,
    } satisfies IShoppingMallAdminUser.ICreate,
  });

  // Attempt category update with unauthorized connection, should fail
  await TestValidator.error(
    "unauthorized user cannot update category",
    async () => {
      await api.functional.shoppingMall.adminUser.categories.update(
        unauthenticatedConnection,
        {
          categoryId: createdCategory.id,
          body: {
            name: "unauthorized update",
          } satisfies IShoppingMallCategory.IUpdate,
        },
      );
    },
  );

  // 5. Attempt update on non-existent category (simulate by random uuid not used previously)
  const fakeCategoryId = typia.random<string & tags.Format<"uuid">>();

  await TestValidator.error(
    "updating non-existent category should fail",
    async () => {
      await api.functional.shoppingMall.adminUser.categories.update(
        connection,
        {
          categoryId: fakeCategoryId,
          body: {
            name: "non-existent update",
          } satisfies IShoppingMallCategory.IUpdate,
        },
      );
    },
  );
}
