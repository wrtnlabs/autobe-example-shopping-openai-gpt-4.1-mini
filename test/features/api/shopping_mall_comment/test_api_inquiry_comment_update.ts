import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallComment } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallComment";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * Test the update of an existing product inquiry comment by an
 * authenticated member user.
 *
 * This test covers the full update flow:
 *
 * 1. Member user account creation (join)
 * 2. Member user login and authentication context establishment
 * 3. Simulation of existing inquiry and comment IDs for update
 * 4. Comment content, privacy flag, and status update
 * 5. Validation that the update was successful and fields match
 *
 * This ensures that comment updates respect authorization, allow
 * modification of key fields, and proper response consistency.
 */
export async function test_api_inquiry_comment_update(
  connection: api.IConnection,
) {
  // 1. Member user join with required fields
  const memberCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(12),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    phone_number: null, // Explicitly null as per schema
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;
  const member: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: memberCreateBody,
    });
  typia.assert(member);

  // 2. Member user login using the created user's credentials
  const loginBody = {
    email: member.email,
    password: memberCreateBody.password_hash,
  } satisfies IShoppingMallMemberUser.ILogin;
  const authorized: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.login(connection, { body: loginBody });
  typia.assert(authorized);

  // 3. Simulate existing inquiryId and commentId for the update
  const inquiryId = typia.random<string & tags.Format<"uuid">>();
  const commentId = typia.random<string & tags.Format<"uuid">>();

  // 4. Prepare update request body with comment content, privacy flag, and status
  const updateBody = {
    comment_body: RandomGenerator.paragraph({
      sentences: 3,
      wordMin: 5,
      wordMax: 10,
    }),
    is_private: RandomGenerator.pick([true, false] as const),
    status: "visible", // Valid status as per business context
  } satisfies IShoppingMallComment.IUpdate;

  // 5. Execute the comment update API call
  const updatedComment: IShoppingMallComment =
    await api.functional.shoppingMall.memberUser.inquiries.comments.updateComment(
      connection,
      {
        inquiryId,
        commentId,
        body: updateBody,
      },
    );
  typia.assert(updatedComment);

  // 6. Validate that the returned data matches the update
  TestValidator.equals(
    "comment body matches",
    updatedComment.comment_body,
    updateBody.comment_body!,
  );
  TestValidator.equals(
    "is_private flag matches",
    updatedComment.is_private,
    updateBody.is_private!,
  );
  TestValidator.equals(
    "status matches",
    updatedComment.status,
    updateBody.status!,
  );
}
