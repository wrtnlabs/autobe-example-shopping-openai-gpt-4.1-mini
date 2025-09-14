import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallComment } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallComment";

/**
 * This test validates the successful update of a product review comment by an
 * admin user.
 *
 * It performs admin user creation via join API and authenticates through login.
 * Afterwards, it executes an update on the review comment by supplying valid
 * UUIDs for reviewId and commentId and modifying the comment_body, is_private,
 * and status fields.
 *
 * The test verifies that the returned comment data matches the updated values,
 * ensuring proper permissions, data integrity, and admin context operations.
 */
export async function test_api_admin_review_comment_update_success(
  connection: api.IConnection,
) {
  // 1. Admin User Creation and Join
  const adminEmail = typia.random<string & tags.Format<"email">>();
  const adminPasswordHash = "hashed_password_sample_1234"; // simulate hashed password
  const adminNickname = RandomGenerator.name();
  const adminFullName = RandomGenerator.name(2);
  const adminStatus = "active";

  const createdAdmin: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: adminEmail,
        password_hash: adminPasswordHash,
        nickname: adminNickname,
        full_name: adminFullName,
        status: adminStatus,
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(createdAdmin);

  // 2. Login as Admin to authenticate context
  const loginAdmin: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.login(connection, {
      body: {
        email: adminEmail,
        password_hash: adminPasswordHash,
      } satisfies IShoppingMallAdminUser.ILogin,
    });
  typia.assert(loginAdmin);

  // 3. Generate valid UUIDs for reviewId and commentId
  const reviewId = typia.random<string & tags.Format<"uuid">>();
  const commentId = typia.random<string & tags.Format<"uuid">>();

  // 4. Prepare realistic update data
  const newCommentBody = RandomGenerator.content({ paragraphs: 1 });
  const newIsPrivate = true;
  const newStatus = "visible";

  const updateBody: IShoppingMallComment.IUpdate = {
    comment_body: newCommentBody,
    is_private: newIsPrivate,
    status: newStatus,
  };

  // 5. Perform the update
  const updatedComment: IShoppingMallComment =
    await api.functional.shoppingMall.adminUser.reviews.comments.update(
      connection,
      {
        reviewId: reviewId,
        commentId: commentId,
        body: updateBody,
      },
    );
  typia.assert(updatedComment);

  // 6. Validate the updated attributes
  TestValidator.equals(
    "comment_body should be updated",
    updatedComment.comment_body,
    newCommentBody,
  );
  TestValidator.equals(
    "is_private flag should be updated",
    updatedComment.is_private,
    newIsPrivate,
  );
  TestValidator.equals(
    "status should be updated",
    updatedComment.status,
    newStatus,
  );
}
