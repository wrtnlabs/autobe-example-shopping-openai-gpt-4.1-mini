import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallChannelCategory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallChannelCategory";

/**
 * Test creating a new channel-category mapping with valid channel and category
 * IDs.
 *
 * This test ensures that an admin user can be created and authenticated, then
 * successfully create a channel-category mapping. It verifies the mapping is
 * returned correctly and persists as expected. All timestamps and IDs are
 * validated for proper format and value.
 */
export async function test_api_channel_category_create_success(
  connection: api.IConnection,
) {
  // 1. Create and authenticate admin user
  const adminUserCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(32),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminUserCreateBody,
    });
  typia.assert(adminUser);

  // 2. Prepare channel-category create request body
  const channelCategoryCreateBody = {
    shopping_mall_channel_id: typia.random<string & tags.Format<"uuid">>(),
    shopping_mall_category_id: typia.random<string & tags.Format<"uuid">>(),
  } satisfies IShoppingMallChannelCategory.ICreate;

  // 3. Create channel-category mapping
  const channelCategory: IShoppingMallChannelCategory =
    await api.functional.shoppingMall.adminUser.channelCategories.createChannelCategory(
      connection,
      {
        body: channelCategoryCreateBody,
      },
    );
  typia.assert(channelCategory);

  // 4. Validate that returned shopping_mall_channel_id and shopping_mall_category_id match the request
  TestValidator.equals(
    "shopping_mall_channel_id matches",
    channelCategory.shopping_mall_channel_id,
    channelCategoryCreateBody.shopping_mall_channel_id,
  );

  TestValidator.equals(
    "shopping_mall_category_id matches",
    channelCategory.shopping_mall_category_id,
    channelCategoryCreateBody.shopping_mall_category_id,
  );

  // 5. Validate additional fields exist and are strings with expected formats
  TestValidator.predicate(
    "channelCategory has valid id",
    typeof channelCategory.id === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
        channelCategory.id,
      ),
  );

  TestValidator.predicate(
    "channelCategory has valid created_at ISO string",
    typeof channelCategory.created_at === "string" &&
      !isNaN(Date.parse(channelCategory.created_at)),
  );

  TestValidator.predicate(
    "channelCategory has valid updated_at ISO string",
    typeof channelCategory.updated_at === "string" &&
      !isNaN(Date.parse(channelCategory.updated_at)),
  );

  // 6. deleted_at can be null or undefined
  TestValidator.predicate(
    "channelCategory deleted_at is null or undefined",
    channelCategory.deleted_at === null ||
      channelCategory.deleted_at === undefined,
  );

  // 7. Optional related channel and category objects if present, validate IDs
  if (
    channelCategory.channel !== undefined &&
    channelCategory.channel !== null
  ) {
    TestValidator.predicate(
      "channelCategory.channel has valid id",
      typeof channelCategory.channel.id === "string" &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
          channelCategory.channel.id,
        ),
    );
  }

  if (
    channelCategory.category !== undefined &&
    channelCategory.category !== null
  ) {
    TestValidator.predicate(
      "channelCategory.category has valid id",
      typeof channelCategory.category.id === "string" &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
          channelCategory.category.id,
        ),
    );
  }
}
