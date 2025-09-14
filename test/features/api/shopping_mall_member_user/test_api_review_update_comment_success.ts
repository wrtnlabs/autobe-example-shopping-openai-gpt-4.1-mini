import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallComment } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallComment";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * End-to-end test for updating a member user's comment under a specified
 * product review.
 *
 * This test simulates the entire flow of: member user registration and
 * authentication, followed by updating an existing comment on a product
 * review with new content, privacy setting, and status. It verifies the
 * correctness of the update response and ensures proper authorization.
 */
export async function test_api_review_update_comment_success(
  connection: api.IConnection,
) {
  // 1. Member user registration and authentication
  const createBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(20),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    phone_number: null,
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;

  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, { body: createBody });
  typia.assert(memberUser);

  // 2. Prepare realistic reviewId and commentId for updating
  const reviewId = typia.random<string & tags.Format<"uuid">>();
  const commentId = typia.random<string & tags.Format<"uuid">>();

  // 3. Construct update body
  const updateBody = {
    comment_body: RandomGenerator.paragraph({
      sentences: 5,
      wordMin: 4,
      wordMax: 8,
    }),
    is_private: RandomGenerator.pick([true, false] as const),
    status: "visible",
  } satisfies IShoppingMallComment.IUpdate;

  // 4. Call update API
  const updatedComment: IShoppingMallComment =
    await api.functional.shoppingMall.memberUser.reviews.comments.update(
      connection,
      {
        reviewId: reviewId,
        commentId: commentId,
        body: updateBody,
      },
    );
  typia.assert(updatedComment);

  // 5. Assert that updatedComment's properties match the updateBody
  TestValidator.equals(
    "updated comment body matches",
    updatedComment.comment_body,
    updateBody.comment_body,
  );
  TestValidator.equals(
    "updated comment is_private flag matches",
    updatedComment.is_private,
    updateBody.is_private,
  );
  TestValidator.equals(
    "updated comment status matches",
    updatedComment.status,
    updateBody.status,
  );
}
