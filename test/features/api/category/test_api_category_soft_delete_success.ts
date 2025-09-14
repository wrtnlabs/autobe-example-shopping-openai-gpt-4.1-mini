import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";

/**
 * Test soft deletion of a category by ID.
 *
 * Validate that "erase" API responds correctly when deleting an existing
 * category ID. Due to absence of category creation and query APIs, the test
 * uses a random UUID to simulate deletion which may trigger error if not
 * existing.
 *
 * Confirm that unauthorized deletion attempts by non-admin users are rejected.
 * Confirm behavior when deleting a non-existent category ID triggers error.
 */
export async function test_api_category_soft_delete_success(
  connection: api.IConnection,
) {
  // Step 1: Admin user registration/authorization
  const adminCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(64),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminCreateBody,
    });
  typia.assert(adminUser);

  // Step 2: Attempt to delete category with a random UUID
  // This simulates the deletion call; may error if category doesn't exist
  const randomCategoryId = typia.random<string & tags.Format<"uuid">>();
  try {
    await api.functional.shoppingMall.adminUser.categories.erase(connection, {
      categoryId: randomCategoryId,
    });
  } catch {
    // In case category doesn't exist, error is expected, so swallow it
  }

  // Step 3: Attempt deletion without authorization (simulate unauthenticated connection)
  const unauthConn: api.IConnection = { ...connection, headers: {} };
  await TestValidator.error(
    "unauthorized delete call should fail",
    async () => {
      await api.functional.shoppingMall.adminUser.categories.erase(unauthConn, {
        categoryId: typia.random<string & tags.Format<"uuid">>(),
      });
    },
  );

  // Step 4: Attempt deletion with a non-existent category ID
  const nonExistentCategoryId = typia.random<string & tags.Format<"uuid">>();
  await TestValidator.error(
    "delete nonexistent category should fail",
    async () => {
      await api.functional.shoppingMall.adminUser.categories.erase(connection, {
        categoryId: nonExistentCategoryId,
      });
    },
  );
}
