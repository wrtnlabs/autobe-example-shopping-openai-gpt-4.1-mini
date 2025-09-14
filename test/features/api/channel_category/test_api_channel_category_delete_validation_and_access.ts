import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallCategory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCategory";
import type { IShoppingMallChannel } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallChannel";
import type { IShoppingMallChannelCategory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallChannelCategory";

/**
 * Test deletion of a specific channel-category mapping by ID. Ensure the
 * specified channel-category relation exists before deletion by creating
 * required sales channel and product category. Confirm access control by using
 * admin user authentication. Validate proper handling of non-existing ID
 * deletion attempt and deletion success with correct authorization.
 */
export async function test_api_channel_category_delete_validation_and_access(
  connection: api.IConnection,
) {
  // 1. Admin User Join
  const adminUserEmail = `admin_${RandomGenerator.alphaNumeric(5)}@example.com`;
  const adminUserPasswordHash = "Password123!"; // For testing purposes, a fixed hashed password string used

  const adminUserCreate: IShoppingMallAdminUser.ICreate = {
    email: adminUserEmail,
    password_hash: adminUserPasswordHash,
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    status: "active",
  };

  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminUserCreate,
    });
  typia.assert(adminUser);

  // 2. Admin User Login (to set correct auth context)
  const adminUserLogin: IShoppingMallAdminUser.ILogin = {
    email: adminUserEmail,
    password_hash: adminUserPasswordHash,
  };
  const loggedInUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.login(connection, {
      body: adminUserLogin,
    });
  typia.assert(loggedInUser);

  // 3. Create Shopping Mall Channel
  const channelCreate: IShoppingMallChannel.ICreate = {
    code: `code_${RandomGenerator.alphaNumeric(3)}`,
    name: RandomGenerator.name(),
    description: "Test channel description",
    status: "active",
  };
  const channel: IShoppingMallChannel =
    await api.functional.shoppingMall.adminUser.channels.create(connection, {
      body: channelCreate,
    });
  typia.assert(channel);

  // 4. Create Product Category
  const categoryCreate: IShoppingMallCategory.ICreate = {
    code: `cat_code_${RandomGenerator.alphaNumeric(3)}`,
    name: RandomGenerator.name(),
    status: "active",
    description: "Test category description",
  };
  const category: IShoppingMallCategory =
    await api.functional.shoppingMall.adminUser.categories.create(connection, {
      body: categoryCreate,
    });
  typia.assert(category);

  // 5. Create Channel-Category Mapping
  const channelCategoryCreate: IShoppingMallChannelCategory.ICreate = {
    shopping_mall_channel_id: channel.id,
    shopping_mall_category_id: category.id,
  };
  const channelCategory: IShoppingMallChannelCategory =
    await api.functional.shoppingMall.adminUser.channelCategories.createChannelCategory(
      connection,
      {
        body: channelCategoryCreate,
      },
    );
  typia.assert(channelCategory);

  // 6. Test deletion with invalid non-existing ID (wrong UUID)
  let invalidId: string & tags.Format<"uuid"> = typia.random<
    string & tags.Format<"uuid">
  >();
  if (invalidId === channelCategory.id) {
    // If random happened to be same as existing ID, regenerate
    invalidId = typia.random<string & tags.Format<"uuid">>();
  }

  await TestValidator.error(
    "Delete channel-category with non-existing ID must fail",
    async () => {
      await api.functional.shoppingMall.adminUser.channelCategories.eraseChannelCategory(
        connection,
        { id: invalidId },
      );
    },
  );

  // 7. Delete the created valid channel-category mapping
  await api.functional.shoppingMall.adminUser.channelCategories.eraseChannelCategory(
    connection,
    { id: channelCategory.id },
  );

  // No response body; success confirmed if no error thrown
}
