import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallComment } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallComment";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * Test scenario for successful creation of a comment on a product review by
 * a member user.
 *
 * This test covers the full flow of:
 *
 * 1. Registering a new member user to obtain an authorized account context and
 *    authentication token.
 * 2. Using this authentication context to post a new comment on an existing
 *    shopping mall product review.
 *
 * The comment will include realistic content, is_private flag, and status,
 * linking explicitly to the reviewId. The authentication context ensures
 * proper authorization as memberUser role. The test verifies that the
 * created comment matches the input data and the response structure.
 */
export async function test_api_review_create_comment_success(
  connection: api.IConnection,
) {
  // 1. Member user registration and authentication
  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: {
        email: `user_${RandomGenerator.alphaNumeric(6)}@test.com`,
        password_hash: RandomGenerator.alphaNumeric(12),
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(2),
        phone_number: null, // optional nullable phone number
        status: "active",
      } satisfies IShoppingMallMemberUser.ICreate,
    });
  typia.assert(memberUser);

  // 2. Prepare a review ID (simulate a valid UUID for an existing review)
  const reviewId: string & tags.Format<"uuid"> = typia.random<
    string & tags.Format<"uuid">
  >();

  // 3. Prepare comment creation data
  const commentBody = {
    comment_body: RandomGenerator.paragraph({
      sentences: 5,
      wordMin: 3,
      wordMax: 8,
    }),
    is_private: false,
    status: "visible",
    parent_comment_id: null,
    shopping_mall_inquiry_id: null,
    shopping_mall_review_id: reviewId,
    shopping_mall_memberuserid: memberUser.id,
    shopping_mall_guestuserid: null,
    shopping_mall_selleruserid: null,
  } satisfies IShoppingMallComment.ICreate;

  // 4. Create a comment on the review
  const createdComment: IShoppingMallComment =
    await api.functional.shoppingMall.memberUser.reviews.comments.create(
      connection,
      {
        reviewId: reviewId,
        body: commentBody,
      },
    );
  typia.assert(createdComment);

  // 5. Validate that the response matches the input data
  TestValidator.equals(
    "created comment body",
    createdComment.comment_body,
    commentBody.comment_body,
  );
  TestValidator.equals(
    "created comment is_private",
    createdComment.is_private,
    commentBody.is_private,
  );
  TestValidator.equals(
    "created comment status",
    createdComment.status,
    commentBody.status,
  );
}
