import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallChannelCategory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallChannelCategory";

/**
 * E2E test for updating an existing channel-category mapping.
 *
 * This test performs the following steps:
 *
 * 1. Authenticates an admin user by joining via the adminUser join endpoint.
 * 2. Generates random UUIDs for an existing channel-category mapping ID, and
 *    new channel and category IDs.
 * 3. Calls the update API to modify the channel-category mapping with the new
 *    channel and category IDs.
 * 4. Validates the API response includes the updated mapping data with
 *    expected IDs and proper timestamps.
 * 5. Uses typia.assert to fully validate API responses and test validator for
 *    business assertions.
 *
 * The test ensures that admin authorization is enforced via SDK token
 * management implicitly.
 */
export async function test_api_channel_category_update_success(
  connection: api.IConnection,
) {
  // 1. Authenticate as admin user by joining
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: `${RandomGenerator.alphaNumeric(10)}@example.com`,
        password_hash: RandomGenerator.alphaNumeric(20),
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // Existing channel-category mapping ID to update (simulate existing record)
  const existingMappingId = typia.random<string & tags.Format<"uuid">>();

  // New channel ID and category ID to update
  const newChannelId = typia.random<string & tags.Format<"uuid">>();
  const newCategoryId = typia.random<string & tags.Format<"uuid">>();

  // 2. Perform update call
  const updatedMapping: IShoppingMallChannelCategory =
    await api.functional.shoppingMall.adminUser.channelCategories.updateChannelCategory(
      connection,
      {
        id: existingMappingId,
        body: {
          shopping_mall_channel_id: newChannelId,
          shopping_mall_category_id: newCategoryId,
        } satisfies IShoppingMallChannelCategory.IUpdate,
      },
    );
  typia.assert(updatedMapping);

  // 3. Validate returned data matches update request
  TestValidator.equals(
    "updated channel ID should match",
    updatedMapping.shopping_mall_channel_id,
    newChannelId,
  );

  TestValidator.equals(
    "updated category ID should match",
    updatedMapping.shopping_mall_category_id,
    newCategoryId,
  );

  // Check timestamps are present
  TestValidator.predicate(
    "created_at timestamp exists",
    typeof updatedMapping.created_at === "string" &&
      updatedMapping.created_at.length > 0,
  );

  TestValidator.predicate(
    "updated_at timestamp exists",
    typeof updatedMapping.updated_at === "string" &&
      updatedMapping.updated_at.length > 0,
  );

  // Optional deleted_at property should be either null or undefined or string
  TestValidator.predicate(
    "deleted_at is nullable",
    updatedMapping.deleted_at === null ||
      updatedMapping.deleted_at === undefined ||
      (typeof updatedMapping.deleted_at === "string" &&
        updatedMapping.deleted_at.length > 0),
  );
}
