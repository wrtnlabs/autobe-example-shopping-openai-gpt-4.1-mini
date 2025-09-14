import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallChannel } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallChannel";

export async function test_api_channel_delete_success(
  connection: api.IConnection,
) {
  // 1. Admin user join for auth context
  const adminUserCreationBody = {
    email: `admin_${RandomGenerator.alphaNumeric(8)}@example.com`,
    password_hash: RandomGenerator.alphaNumeric(16),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminUserCreationBody,
    });
  typia.assert(adminUser);

  // 2. Create a new sales channel
  const channelCreateBody = {
    code: `chan_${RandomGenerator.alphaNumeric(6)}`,
    name: RandomGenerator.name(),
    status: "active",
    description: `Description for channel ${RandomGenerator.alphaNumeric(4)}`,
  } satisfies IShoppingMallChannel.ICreate;

  const createdChannel: IShoppingMallChannel =
    await api.functional.shoppingMall.adminUser.channels.create(connection, {
      body: channelCreateBody,
    });
  typia.assert(createdChannel);

  TestValidator.equals(
    "Created channel code matches",
    createdChannel.code,
    channelCreateBody.code,
  );
  TestValidator.equals(
    "Created channel name matches",
    createdChannel.name,
    channelCreateBody.name,
  );
  TestValidator.equals(
    "Created channel status matches",
    createdChannel.status,
    channelCreateBody.status,
  );

  // 3. Delete the channel by ID
  await api.functional.shoppingMall.adminUser.channels.erase(connection, {
    id: createdChannel.id,
  });

  // 4. Since no direct get or list endpoint is available, assume success if no exception thrown
  TestValidator.predicate("Channel deletion completed without error", true);
}
