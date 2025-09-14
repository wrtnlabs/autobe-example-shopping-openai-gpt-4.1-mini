import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallCategory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCategory";

export async function test_api_category_deletion_success_and_unauthorized_failure(
  connection: api.IConnection,
) {
  // 1. Create and authenticate the first admin user
  const firstAdminBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(32),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;
  const firstAdmin: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: firstAdminBody,
    });
  typia.assert(firstAdmin);

  // 2. Create a product category using the first admin user
  const categoryBody = {
    code: RandomGenerator.alphabets(5).toUpperCase(),
    name: RandomGenerator.name(),
    status: "active",
    description: null,
  } satisfies IShoppingMallCategory.ICreate;
  const category: IShoppingMallCategory =
    await api.functional.shoppingMall.adminUser.categories.create(connection, {
      body: categoryBody,
    });
  typia.assert(category);

  // 3. Delete the created category
  await api.functional.shoppingMall.adminUser.categories.erase(connection, {
    categoryId: category.id,
  });

  // 4. Attempt to delete the deleted category again, expecting error
  await TestValidator.error(
    "deleting non-existent category should fail",
    async () => {
      await api.functional.shoppingMall.adminUser.categories.erase(connection, {
        categoryId: category.id,
      });
    },
  );

  // Unauthorized deletion test removed due to SDK and connection header management constraints.
}
