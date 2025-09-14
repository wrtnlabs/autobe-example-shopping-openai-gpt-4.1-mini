import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallChannel } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallChannel";

/**
 * Execute a successful creation of a shopping mall sales channel.
 *
 * This test simulates the entire process of setting up an admin user
 * account with the ability to create channels within the shopping mall
 * backend. First, it registers an administrator via the auth join endpoint,
 * which handles automatic token authorization. Then, it creates a unique
 * sales channel with specified code, name, and status, passing null for the
 * optional description.
 *
 * The test verifies the channel creation is successful by asserting the
 * response structure and checking that all created properties match the
 * input parameters, ensuring correct state persistence.
 */
export async function test_api_channel_create_success(
  connection: api.IConnection,
) {
  // 1. Create a new admin user (join) to establish authenticated context
  const adminUserEmail: string = typia.random<string & tags.Format<"email">>();
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: adminUserEmail,
        password_hash: RandomGenerator.alphaNumeric(24),
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(2),
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // 2. Create a new channel using authenticated context
  const channelCode = RandomGenerator.alphaNumeric(12);
  const channelName = RandomGenerator.name();
  const channelStatus = "active";

  const createdChannel: IShoppingMallChannel =
    await api.functional.shoppingMall.adminUser.channels.create(connection, {
      body: {
        code: channelCode,
        name: channelName,
        description: null,
        status: channelStatus,
      } satisfies IShoppingMallChannel.ICreate,
    });
  typia.assert(createdChannel);

  // 3. Validate returned channel data
  TestValidator.equals(
    "created channel code matches",
    createdChannel.code,
    channelCode,
  );
  TestValidator.equals(
    "created channel name matches",
    createdChannel.name,
    channelName,
  );
  TestValidator.equals(
    "created channel description is null",
    createdChannel.description,
    null,
  );
  TestValidator.equals(
    "created channel status matches",
    createdChannel.status,
    channelStatus,
  );
}
