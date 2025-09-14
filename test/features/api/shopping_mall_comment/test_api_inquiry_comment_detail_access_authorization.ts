import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallComment } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallComment";

/**
 * Validate access authorization and retrieval of a specific product inquiry
 * comment detail as an admin user.
 *
 * This test covers the full authentication process for admin users,
 * including joining and logging in, ensuring secure tokens are issued and
 * used. After authentication, it tests fetching a comment detail for a
 * given inquiryId and commentId with valid UUIDs. The returned comment is
 * validated against IShoppingMallComment structure, confirming correctness
 * of content, privacy flag, and status string. It also tests error handling
 * by attempting to access with an invalid comment ID, expecting an error.
 *
 * Steps:
 *
 * 1. Admin user joins via the /auth/adminUser/join API.
 * 2. Admin user logs in via the /auth/adminUser/login API using the created
 *    credentials.
 * 3. Using the authorized admin connection, retrieve the comment detail for
 *    realistic inquiry and comment IDs.
 * 4. Validate the comment structure and properties with typia.assert.
 * 5. Attempt to retrieve comment with wrong ID and verify error throwing.
 */
export async function test_api_inquiry_comment_detail_access_authorization(
  connection: api.IConnection,
) {
  // 1. Admin user registration (join)
  const adminCreateBody = {
    email: `${RandomGenerator.alphaNumeric(8).toLowerCase()}@test.com`,
    password_hash: RandomGenerator.alphaNumeric(16),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const adminAuthorized: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminCreateBody,
    });
  typia.assert(adminAuthorized);

  // 2. Admin user login
  const adminLoginBody = {
    email: adminCreateBody.email,
    password_hash: adminCreateBody.password_hash,
  } satisfies IShoppingMallAdminUser.ILogin;

  const adminLoggedIn: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.login(connection, {
      body: adminLoginBody,
    });
  typia.assert(adminLoggedIn);

  // 3. Fetch comment detail with valid inquiryId and commentId
  const inquiryId = typia.random<string & tags.Format<"uuid">>();
  const commentId = typia.random<string & tags.Format<"uuid">>();

  const comment: IShoppingMallComment =
    await api.functional.shoppingMall.adminUser.inquiries.comments.at(
      connection,
      { inquiryId, commentId },
    );
  typia.assert(comment);

  TestValidator.predicate(
    "Comment is not empty",
    comment.comment_body.length > 0,
  );
  TestValidator.predicate(
    "Status is a non-empty string",
    typeof comment.status === "string" && comment.status.length > 0,
  );

  // 4. Fetch comment detail with invalid commentId, expect error
  const invalidCommentId = typia.random<string & tags.Format<"uuid">>();
  await TestValidator.error(
    "Fetching with invalid commentId should throw",
    async () => {
      await api.functional.shoppingMall.adminUser.inquiries.comments.at(
        connection,
        { inquiryId, commentId: invalidCommentId },
      );
    },
  );
}
