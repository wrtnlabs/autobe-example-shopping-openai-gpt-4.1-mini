import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallChannelCategory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallChannelCategory";

export async function test_api_channel_category_create_success(
  connection: api.IConnection,
) {
  // 1. Create the admin user and log in
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: typia.random<string & tags.Format<"email">>(),
        password_hash: RandomGenerator.alphaNumeric(20),
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // 2. Create channel-category mapping
  // Create realistic random UUIDs for channel and category IDs
  const shoppingMallChannelId: string = typia.random<
    string & tags.Format<"uuid">
  >();
  const shoppingMallCategoryId: string = typia.random<
    string & tags.Format<"uuid">
  >();

  const channelCategory: IShoppingMallChannelCategory =
    await api.functional.shoppingMall.adminUser.channelCategories.createChannelCategory(
      connection,
      {
        body: {
          shopping_mall_channel_id: shoppingMallChannelId,
          shopping_mall_category_id: shoppingMallCategoryId,
        } satisfies IShoppingMallChannelCategory.ICreate,
      },
    );
  typia.assert(channelCategory);

  // 3. Validate crucial returned properties
  TestValidator.predicate(
    "created_at exists and is ISO 8601 date-time string",
    typeof channelCategory.created_at === "string" &&
      channelCategory.created_at.length > 0,
  );

  TestValidator.predicate(
    "updated_at exists and is ISO 8601 date-time string",
    typeof channelCategory.updated_at === "string" &&
      channelCategory.updated_at.length > 0,
  );

  TestValidator.equals(
    "shopping_mall_channel_id matches input",
    channelCategory.shopping_mall_channel_id,
    shoppingMallChannelId,
  );

  TestValidator.equals(
    "shopping_mall_category_id matches input",
    channelCategory.shopping_mall_category_id,
    shoppingMallCategoryId,
  );

  // 4. Validate nested channel and category objects structure if present
  if (
    channelCategory.channel !== undefined &&
    channelCategory.channel !== null
  ) {
    typia.assert(channelCategory.channel);
    TestValidator.equals(
      "channel.id matches shopping_mall_channel_id",
      channelCategory.channel.id,
      channelCategory.shopping_mall_channel_id,
    );
    TestValidator.predicate(
      "channel.code is non-empty string",
      typeof channelCategory.channel.code === "string" &&
        channelCategory.channel.code.length > 0,
    );
    TestValidator.predicate(
      "channel.name is non-empty string",
      typeof channelCategory.channel.name === "string" &&
        channelCategory.channel.name.length > 0,
    );
  }

  if (
    channelCategory.category !== undefined &&
    channelCategory.category !== null
  ) {
    typia.assert(channelCategory.category);
    TestValidator.equals(
      "category.id matches shopping_mall_category_id",
      channelCategory.category.id,
      channelCategory.shopping_mall_category_id,
    );
    TestValidator.predicate(
      "category.code is non-empty string",
      typeof channelCategory.category.code === "string" &&
        channelCategory.category.code.length > 0,
    );
    TestValidator.predicate(
      "category.name is non-empty string",
      typeof channelCategory.category.name === "string" &&
        channelCategory.category.name.length > 0,
    );
  }
}
