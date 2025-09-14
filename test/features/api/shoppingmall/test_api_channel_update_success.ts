import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallChannel } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallChannel";

/**
 * E2E test validating the successful update of a shopping mall sales
 * channel.
 *
 * This test covers:
 *
 * 1. Creating an authenticated admin user context.
 * 2. Creating a new sales channel to obtain a valid channel ID.
 * 3. Updating the channel's name, clearing description, and changing status.
 * 4. Validating that the update response reflects requested changes correctly.
 * 5. Verifying that the channel code remains unchanged as it is immutable.
 */
export async function test_api_channel_update_success(
  connection: api.IConnection,
) {
  // 1. Create a new admin user to authenticate as admin
  const adminCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(20),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminCreateBody,
    });
  typia.assert(adminUser);

  // 2. Create a new sales channel to get a valid channel ID
  const newChannelCreateBody = {
    code: RandomGenerator.alphaNumeric(10),
    name: RandomGenerator.paragraph({ sentences: 3, wordMin: 5, wordMax: 10 }),
    description: RandomGenerator.content({ paragraphs: 2 }),
    status: "active",
  } satisfies IShoppingMallChannel.ICreate;
  const createdChannel: IShoppingMallChannel =
    await api.functional.shoppingMall.adminUser.channels.create(connection, {
      body: newChannelCreateBody,
    });
  typia.assert(createdChannel);

  // 3. Prepare update body with new name, description and status
  const updateBody = {
    name: RandomGenerator.paragraph({ sentences: 5, wordMin: 4, wordMax: 9 }),
    description: null,
    status: "inactive",
  } satisfies IShoppingMallChannel.IUpdate;

  // 4. Perform update
  const updatedChannel: IShoppingMallChannel =
    await api.functional.shoppingMall.adminUser.channels.update(connection, {
      id: createdChannel.id,
      body: updateBody,
    });
  typia.assert(updatedChannel);

  // 5. Validate that update is reflected correctly
  TestValidator.equals(
    "updated channel id matches create id",
    updatedChannel.id,
    createdChannel.id,
  );
  TestValidator.equals(
    "updated channel code remains unchanged",
    updatedChannel.code,
    createdChannel.code,
  );
  TestValidator.equals(
    "updated channel name matches update payload",
    updatedChannel.name,
    updateBody.name,
  );
  TestValidator.equals(
    "updated channel description is cleared",
    updatedChannel.description,
    null,
  );
  TestValidator.equals(
    "updated channel status matches update payload",
    updatedChannel.status,
    updateBody.status,
  );
}
