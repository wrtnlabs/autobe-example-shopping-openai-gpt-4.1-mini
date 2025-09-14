import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallChannelCategory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallChannelCategory";

/**
 * Test retrieval failure for non-existent channel-category mapping ID.
 *
 * This test verifies that when an authenticated admin user attempts to
 * retrieve a channel-category mapping with a non-existent UUID, the system
 * returns an error indicating the resource was not found.
 *
 * Steps:
 *
 * 1. Create and authenticate an admin user.
 * 2. Attempt to fetch a channel-category mapping with a random UUID not
 *    present in the system.
 * 3. Assert that an HTTP error is thrown indicating failure.
 */
export async function test_api_channel_category_get_detail_not_found(
  connection: api.IConnection,
) {
  // 1. Create an admin user and authenticate
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: `admin+${RandomGenerator.alphaNumeric(8)}@example.com`,
        password_hash: RandomGenerator.alphaNumeric(32),
        nickname: RandomGenerator.name(2),
        full_name: RandomGenerator.name(3),
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // 2. Attempt to get channel-category detail with a non-existent UUID
  const nonExistentId = typia.random<string & tags.Format<"uuid">>();

  // 3. Expect an HTTP error (e.g. 404 Not Found) due to non-existence
  await TestValidator.error(
    "get channel-category detail fails for non-existent ID",
    async () => {
      await api.functional.shoppingMall.adminUser.channelCategories.atChannelCategory(
        connection,
        { id: nonExistentId },
      );
    },
  );
}
