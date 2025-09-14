import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallChannelCategory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallChannelCategory";

/**
 * End-to-End test for retrieving a single channel-category mapping by ID as
 * an admin user.
 *
 * This test verifies that an admin user can successfully authenticate,
 * retrieve detailed channel-category mapping information including nested
 * channel and category data.
 *
 * Steps:
 *
 * 1. Create admin user and authenticate via /auth/adminUser/join
 * 2. Retrieve the channel-category mapping using a valid UUID id
 * 3. Assert that the response matches the expected structure exactly
 * 4. Validate nested channel and category entities if present
 *
 * Ensures API security, data completeness, and schema compliance. Covers
 * valid authorization and resource retrieval flow.
 *
 * Note: Negative or unauthorized scenarios are acknowledged but not
 * explicitly tested here to avoid unwarranted failures as per scenario
 * guidance.
 */
export async function test_api_channel_category_retrieval_success(
  connection: api.IConnection,
) {
  // 1. Create and authenticate admin user (join operation)
  const adminCreateData = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(16),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminCreateData,
    });
  typia.assert(adminUser);

  // 2. Retrieve a channel-category mapping with a valid UUID
  const channelCategoryId = typia.random<string & tags.Format<"uuid">>();

  const channelCategory: IShoppingMallChannelCategory =
    await api.functional.shoppingMall.adminUser.channelCategories.atChannelCategory(
      connection,
      {
        id: channelCategoryId,
      },
    );
  typia.assert(channelCategory);

  // 3. If nested channel or category objects are present, assert their types
  if (
    channelCategory.channel !== undefined &&
    channelCategory.channel !== null
  ) {
    typia.assert(channelCategory.channel);
  }
  if (
    channelCategory.category !== undefined &&
    channelCategory.category !== null
  ) {
    typia.assert(channelCategory.category);
  }
}
