import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallChannel } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallChannel";

/**
 * Test creation of a new sales channel by an admin user.
 *
 * This test function covers:
 *
 * 1. Admin user registration and authentication
 * 2. Successful creation of a unique channel with valid code, name, status, and
 *    optional description
 * 3. Failure scenario for duplicate channel code creation attempt
 */
export async function test_api_channel_create_admin_success(
  connection: api.IConnection,
) {
  // 1. Admin user joins and authenticates
  const adminUserEmail: string = typia.random<string & tags.Format<"email">>();
  const adminUserPasswordHash = RandomGenerator.alphaNumeric(32);

  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: adminUserEmail,
        password_hash: adminUserPasswordHash,
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // 2. Create a new channel with unique code
  const channelCode = `chan_${RandomGenerator.alphaNumeric(8)}`;
  const channelName = RandomGenerator.paragraph({
    sentences: 3,
    wordMin: 5,
    wordMax: 10,
  });
  const channelStatus = "active"; // business valid status
  const channelDescription = "Test channel for sales";

  const channel: IShoppingMallChannel =
    await api.functional.shoppingMall.adminUser.channels.create(connection, {
      body: {
        code: channelCode,
        name: channelName,
        description: channelDescription,
        status: channelStatus,
      } satisfies IShoppingMallChannel.ICreate,
    });
  typia.assert(channel);

  TestValidator.equals("created channel code", channel.code, channelCode);
  TestValidator.equals("created channel name", channel.name, channelName);
  TestValidator.equals("created channel status", channel.status, channelStatus);
  // Description may be nullable or optional, test equality explicitly
  TestValidator.equals(
    "created channel description",
    channel.description ?? null,
    channelDescription,
  );

  // Validate timestamps are ISO date-time strings
  TestValidator.predicate(
    "created_at is date-time string",
    typeof channel.created_at === "string" &&
      /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z/.test(channel.created_at),
  );
  TestValidator.predicate(
    "updated_at is date-time string",
    typeof channel.updated_at === "string" &&
      /\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z/.test(channel.updated_at),
  );

  // 3. Attempt duplicate channel creation with same code
  const duplicateRequest = {
    code: channelCode,
    name: RandomGenerator.paragraph({ sentences: 3 }),
    status: channelStatus,
  } satisfies IShoppingMallChannel.ICreate;
  await TestValidator.error(
    "duplicate channel code creation should fail",
    async () => {
      await api.functional.shoppingMall.adminUser.channels.create(connection, {
        body: duplicateRequest,
      });
    },
  );
}
