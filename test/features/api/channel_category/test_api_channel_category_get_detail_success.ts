import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallChannelCategory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallChannelCategory";

/**
 * This end-to-end test performs the following steps:
 *
 * 1. Creates an admin user through the authentication join API, obtaining
 *    administrative credentials and an authorization token.
 * 2. Retrieves a detailed channel-category mapping by a specific UUID,
 *    invoking the GET /shoppingMall/adminUser/channelCategories/{id}
 *    endpoint.
 * 3. Validates that the retrieved data includes all required base properties
 *    of the mapping entity including channel and category nested objects.
 * 4. Ensures that the nested channel includes its id, code, name, description
 *    (nullable), status, created_at, updated_at, and optional deleted_at
 *    fields.
 * 5. Ensures that the nested category includes its id, code, name, status,
 *    description (nullable), created_at, updated_at, and optional
 *    deleted_at fields.
 * 6. Performs typia.assert validation on responses to validate schema
 *    compliance.
 *
 * The test simulates real administrative access to ensure end-to-end
 * correctness in data retrieval for the channel-category resource.
 */
export async function test_api_channel_category_get_detail_success(
  connection: api.IConnection,
) {
  // 1. Create an admin user and obtain authorization
  const adminUserCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(20),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const authorizedAdminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminUserCreateBody,
    });
  typia.assert(authorizedAdminUser);

  // 2. Retrieve detailed channel-category mapping by UUID
  // We'll use an existing valid UUID for testing. Here, typia.random generates a UUID string.
  const channelCategoryId = typia.random<string & tags.Format<"uuid">>();

  const channelCategoryDetail: IShoppingMallChannelCategory =
    await api.functional.shoppingMall.adminUser.channelCategories.atChannelCategory(
      connection,
      { id: channelCategoryId },
    );
  typia.assert(channelCategoryDetail);

  // 3. Validate core properties of channel-category mapping
  TestValidator.predicate(
    "channel-category id is a valid UUID",
    typeof channelCategoryDetail.id === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(
        channelCategoryDetail.id,
      ),
  );

  TestValidator.equals(
    "assigned channel id matches",
    channelCategoryDetail.shopping_mall_channel_id,
    channelCategoryDetail.channel?.id ??
      channelCategoryDetail.shopping_mall_channel_id,
  );

  TestValidator.equals(
    "assigned category id matches",
    channelCategoryDetail.shopping_mall_category_id,
    channelCategoryDetail.category?.id ??
      channelCategoryDetail.shopping_mall_category_id,
  );

  TestValidator.predicate(
    "created_at is ISO string",
    typeof channelCategoryDetail.created_at === "string",
  );

  TestValidator.predicate(
    "updated_at is ISO string",
    typeof channelCategoryDetail.updated_at === "string",
  );

  // deleted_at can be null or undefined or string
  TestValidator.predicate(
    "deleted_at is valid or undefined",
    channelCategoryDetail.deleted_at === null ||
      channelCategoryDetail.deleted_at === undefined ||
      typeof channelCategoryDetail.deleted_at === "string",
  );

  // 4. Validate nested channel object if present
  if (
    channelCategoryDetail.channel !== undefined &&
    channelCategoryDetail.channel !== null
  ) {
    const channel = channelCategoryDetail.channel;
    typia.assert(channel);
    TestValidator.predicate(
      "channel.id is UUID",
      typeof channel.id === "string" &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(
          channel.id,
        ),
    );
    TestValidator.predicate(
      "channel.code is non-empty string",
      typeof channel.code === "string" && channel.code.length > 0,
    );
    TestValidator.predicate(
      "channel.name is non-empty string",
      typeof channel.name === "string" && channel.name.length > 0,
    );
    TestValidator.predicate(
      "channel.description is null or string",
      channel.description === null ||
        channel.description === undefined ||
        typeof channel.description === "string",
    );
    TestValidator.predicate(
      "channel.status is non-empty string",
      typeof channel.status === "string" && channel.status.length > 0,
    );
    TestValidator.predicate(
      "channel.created_at is string",
      typeof channel.created_at === "string",
    );
    TestValidator.predicate(
      "channel.updated_at is string",
      typeof channel.updated_at === "string",
    );
    TestValidator.predicate(
      "channel.deleted_at is valid or undefined",
      channel.deleted_at === null ||
        channel.deleted_at === undefined ||
        typeof channel.deleted_at === "string",
    );
  }

  // 5. Validate nested category object if present
  if (
    channelCategoryDetail.category !== undefined &&
    channelCategoryDetail.category !== null
  ) {
    const category = channelCategoryDetail.category;
    typia.assert(category);
    TestValidator.predicate(
      "category.id is UUID",
      typeof category.id === "string" &&
        /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(
          category.id,
        ),
    );
    TestValidator.predicate(
      "category.code is non-empty string",
      typeof category.code === "string" && category.code.length > 0,
    );
    TestValidator.predicate(
      "category.name is non-empty string",
      typeof category.name === "string" && category.name.length > 0,
    );
    TestValidator.predicate(
      "category.status is non-empty string",
      typeof category.status === "string" && category.status.length > 0,
    );
    TestValidator.predicate(
      "category.description is null or string",
      category.description === null ||
        category.description === undefined ||
        typeof category.description === "string",
    );
    TestValidator.predicate(
      "category.created_at is string",
      typeof category.created_at === "string",
    );
    TestValidator.predicate(
      "category.updated_at is string",
      typeof category.updated_at === "string",
    );
    TestValidator.predicate(
      "category.deleted_at is valid or undefined",
      category.deleted_at === null ||
        category.deleted_at === undefined ||
        typeof category.deleted_at === "string",
    );
  }
}
