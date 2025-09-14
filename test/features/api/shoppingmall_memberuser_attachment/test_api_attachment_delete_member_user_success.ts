import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * Test deleting an existing attachment metadata record by authenticated
 * member user.
 *
 * This test function performs the following steps:
 *
 * 1. Authenticate as a member user with valid credentials.
 * 2. Simulate creating an attachment record by generating a valid UUID as its
 *    ID.
 * 3. Delete the attachment using the DELETE endpoint.
 * 4. Verify deletion succeeds without error.
 * 5. Attempt deletion without authentication expected to fail.
 * 6. Attempt deletion with unknown ID expected to fail.
 */
export async function test_api_attachment_delete_member_user_success(
  connection: api.IConnection,
) {
  // 1. Authenticate as member user by join
  const memberUserCreateBody = {
    email: `user${Date.now()}@example.com`,
    password_hash: "password1234",
    nickname: "Tester",
    full_name: "Test User",
    phone_number: null,
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;

  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: memberUserCreateBody,
    });
  typia.assert(memberUser);

  // 2. Simulate attachment creation by generating an attachment ID (UUID)
  const attachmentId = typia.random<string & tags.Format<"uuid">>();

  // 3. Delete the attachment as authenticated member user
  await api.functional.shoppingMall.memberUser.attachments.erase(connection, {
    id: attachmentId,
  });

  // 4. Verify deletion succeeded - since return is void, no error is success

  // 5. Attempt deletion without authentication should fail
  const unauthenticatedConnection: api.IConnection = {
    ...connection,
    headers: {},
  };
  await TestValidator.error(
    "deletion without authentication should fail",
    async () => {
      await api.functional.shoppingMall.memberUser.attachments.erase(
        unauthenticatedConnection,
        { id: attachmentId },
      );
    },
  );

  // 6. Attempt deletion with unknown attachment ID should fail for authenticated user
  const randomUnknownId = typia.random<string & tags.Format<"uuid">>();
  await TestValidator.error(
    "deletion with unknown attachment ID should fail",
    async () => {
      await api.functional.shoppingMall.memberUser.attachments.erase(
        connection,
        { id: randomUnknownId },
      );
    },
  );
}
