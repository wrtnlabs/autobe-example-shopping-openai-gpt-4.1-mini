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
 * This test validates the full lifecycle of a sales channel-product category
 * mapping deletion by an authorized admin user.
 *
 * Business context: An admin user creates a sales channel and a product
 * category, then associates them as a channel-category mapping. The mapping is
 * subsequently deleted by its ID.
 *
 * This test asserts successful creation and deletion without errors, using
 * realistic random data compliant with all DTO constraints.
 */
export async function test_api_channel_category_delete_success(
  connection: api.IConnection,
) {
  // 1. Register and authenticate as an admin user
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: typia.random<string & tags.Format<"email">>(),
        password_hash: RandomGenerator.alphaNumeric(16),
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(2),
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // 2. Create a sales channel
  const channel: IShoppingMallChannel =
    await api.functional.shoppingMall.adminUser.channels.create(connection, {
      body: {
        code: RandomGenerator.alphaNumeric(8),
        name: RandomGenerator.name(),
        status: "active",
        description: null,
      } satisfies IShoppingMallChannel.ICreate,
    });
  typia.assert(channel);

  // 3. Create a product category
  const category: IShoppingMallCategory =
    await api.functional.shoppingMall.adminUser.categories.create(connection, {
      body: {
        code: RandomGenerator.alphaNumeric(8),
        name: RandomGenerator.name(),
        status: "active",
        description: null,
      } satisfies IShoppingMallCategory.ICreate,
    });
  typia.assert(category);

  // 4. Create a channel-category mapping between the channel and category
  const channelCategory: IShoppingMallChannelCategory =
    await api.functional.shoppingMall.adminUser.channelCategories.createChannelCategory(
      connection,
      {
        body: {
          shopping_mall_channel_id: channel.id,
          shopping_mall_category_id: category.id,
        } satisfies IShoppingMallChannelCategory.ICreate,
      },
    );
  typia.assert(channelCategory);

  // 5. Delete the created channel-category mapping by its ID
  await api.functional.shoppingMall.adminUser.channelCategories.eraseChannelCategory(
    connection,
    {
      id: channelCategory.id,
    },
  );
}
