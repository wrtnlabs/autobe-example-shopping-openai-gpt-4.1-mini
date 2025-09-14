import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAttachments } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAttachments";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * Test updating attachment metadata with valid data for authenticated member
 * user.
 *
 * This E2E test function performs the following steps:
 *
 * 1. Authenticates a new member user using the join API.
 * 2. Simulates creating an initial attachment metadata record with random valid
 *    data.
 * 3. Performs a metadata update using valid data for file_name, file_url,
 *    media_type, file_size, and upload_ip.
 * 4. Validates the updated metadata matches the update request.
 * 5. Tests failure when updating without authentication.
 * 6. Tests failure when updating with an invalid attachment ID.
 *
 * All API operations are verified with typia.assert and errors are expected
 * properly.
 *
 * This test ensures member user attachment metadata update behaves as
 * specified, enforcing authorization, data integrity, and API correctness.
 */
export async function test_api_attachment_update_member_user_success(
  connection: api.IConnection,
) {
  // 1. Authenticate a new member user to obtain token
  const createUser = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(12),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: null,
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;

  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, { body: createUser });
  typia.assert(memberUser);

  // 2. Simulate creating an attachment metadata (assuming not actual API for creation)
  // Using random data for the initial attachment
  const initialAttachment = typia.random<IShoppingMallAttachments>();
  typia.assert(initialAttachment);

  // 3. Prepare attachment update data with changed values
  const updateBody = {
    file_name: RandomGenerator.alphaNumeric(10) + ".txt",
    file_url: `https://cdn.example.com/${RandomGenerator.alphaNumeric(20)}.txt`,
    media_type: "text/plain",
    file_size: typia.random<
      number & tags.Type<"int32"> & tags.Minimum<1> & tags.Maximum<100000>
    >() satisfies number as number,
    upload_ip: RandomGenerator.pick([
      "192.168.0.1",
      "10.0.0.1",
      "172.16.0.1",
    ] as const),
  } satisfies IShoppingMallAttachments.IUpdate;

  // 4. Perform successful update using authenticated connection
  const updatedAttachment =
    await api.functional.shoppingMall.memberUser.attachments.update(
      connection,
      { id: initialAttachment.id, body: updateBody },
    );
  typia.assert(updatedAttachment);

  TestValidator.equals(
    "updated attachment id should match initial",
    updatedAttachment.id,
    initialAttachment.id,
  );
  TestValidator.equals(
    "updated file_name matches",
    updatedAttachment.file_name,
    updateBody.file_name,
  );
  TestValidator.equals(
    "updated file_url matches",
    updatedAttachment.file_url,
    updateBody.file_url,
  );
  TestValidator.equals(
    "updated media_type matches",
    updatedAttachment.media_type,
    updateBody.media_type,
  );
  TestValidator.equals(
    "updated file_size matches",
    updatedAttachment.file_size,
    updateBody.file_size,
  );
  TestValidator.equals(
    "updated upload_ip matches",
    updatedAttachment.upload_ip,
    updateBody.upload_ip,
  );

  // 5. Failure scenario: Attempt update without authentication should fail
  const anonymousConnection: api.IConnection = { ...connection, headers: {} };
  await TestValidator.error(
    "update without authentication should fail",
    async () => {
      await api.functional.shoppingMall.memberUser.attachments.update(
        anonymousConnection,
        { id: initialAttachment.id, body: updateBody },
      );
    },
  );

  // 6. Failure scenario: Attempt update with invalid attachment ID
  await TestValidator.error("update with invalid id should fail", async () => {
    await api.functional.shoppingMall.memberUser.attachments.update(
      connection,
      {
        id: "00000000-0000-0000-0000-000000000000",
        body: updateBody,
      },
    );
  });
}
