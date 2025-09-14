import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallChannelCategory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallChannelCategory";

export async function test_api_channel_category_update_invalid_category_id_error(
  connection: api.IConnection,
) {
  // 1. Create admin user for authentication
  const adminUserEmail = typia.random<string & tags.Format<"email">>();
  const adminUserPasswordHash = RandomGenerator.alphaNumeric(64);
  const adminUserNickname = RandomGenerator.name();
  const adminUserFullName = RandomGenerator.name();
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

  // 2. Prepare invalid category ID to update
  const invalidCategoryId = typia.random<string & tags.Format<"uuid">>();

  // 3. Prepare random UUID for an existing channel-category mapping ID
  const existingChannelCategoryId = typia.random<
    string & tags.Format<"uuid">
  >();

  // 4. Attempt to update the channel-category mapping with invalid category ID
  await TestValidator.error(
    "Updating channel-category mapping with invalid category ID should fail",
    async () => {
      await api.functional.shoppingMall.adminUser.channelCategories.updateChannelCategory(
        connection,
        {
          id: existingChannelCategoryId,
          body: {
            shopping_mall_category_id: invalidCategoryId,
          } satisfies IShoppingMallChannelCategory.IUpdate,
        },
      );
    },
  );
}
