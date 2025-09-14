import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallChannelCategory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallChannelCategory";

/**
 * This E2E test validates the channel-category creation failure with an invalid
 * channel ID under an authenticated admin user context.
 *
 * The workflow:
 *
 * 1. Create an admin user to obtain authentication credentials.
 * 2. Attempt to create a channel-category mapping with an invalid channel ID.
 * 3. Confirm that the call fails as expected due to invalid channel ID.
 */
export async function test_api_channel_category_create_invalid_channel_id_error(
  connection: api.IConnection,
) {
  // 1. Create an admin user and establish authentication context
  const adminCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(32),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminCreateBody,
    });
  typia.assert(adminUser);

  // 2. Prepare an invalid channel ID and a valid category ID
  const invalidChannelId = typia.random<string & tags.Format<"uuid">>();
  const validCategoryId = typia.random<string & tags.Format<"uuid">>();

  const channelCategoryCreateBody = {
    shopping_mall_channel_id: invalidChannelId,
    shopping_mall_category_id: validCategoryId,
  } satisfies IShoppingMallChannelCategory.ICreate;

  // 3. Attempt to create channel-category mapping and expect failure
  await TestValidator.error(
    "should fail to create channel-category with invalid channel ID",
    async () => {
      await api.functional.shoppingMall.adminUser.channelCategories.createChannelCategory(
        connection,
        {
          body: channelCategoryCreateBody,
        },
      );
    },
  );
}
