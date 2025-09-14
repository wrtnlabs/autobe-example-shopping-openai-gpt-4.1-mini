import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallComment } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallComment";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * Test retrieving a specific comment for a product review by an authenticated
 * member user.
 *
 * This test covers the full workflow of member user registration to establish
 * authentication, followed by fetching a comment via reviewId and commentId. It
 * validates the comment's core properties and confirms the data structure
 * matches exactly the expected DTO schema.
 *
 * Steps:
 *
 * 1. Register a member user using the join API, confirming required data and
 *    formats.
 * 2. Retrieve the comment associated with a review by providing valid UUIDs.
 * 3. Assert the retrieved data with typia and validate key properties using
 *    TestValidator.
 */
export async function test_api_comment_at_with_member_authentication(
  connection: api.IConnection,
) {
  // Step 1: Member user join and authenticate
  const memberJoinBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: "Abc12345$",
    nickname: RandomGenerator.name(2),
    full_name: RandomGenerator.name(2),
    phone_number: null,
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;

  const member: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: memberJoinBody,
    });
  typia.assert(member);

  // Step 2: Retrieve a comment with simulated valid UUIDs
  const reviewId = typia.random<string & tags.Format<"uuid">>();
  const commentId = typia.random<string & tags.Format<"uuid">>();

  const comment: IShoppingMallComment =
    await api.functional.shoppingMall.memberUser.reviews.comments.at(
      connection,
      {
        reviewId,
        commentId,
      },
    );
  typia.assert(comment);

  // Step 3: Validate properties of the comment
  TestValidator.predicate(
    "comment body should be non-empty",
    comment.comment_body.length > 0,
  );
  TestValidator.predicate(
    "is_private is boolean",
    typeof comment.is_private === "boolean",
  );
  TestValidator.predicate(
    "status is non-empty string",
    typeof comment.status === "string" && comment.status.length > 0,
  );
}
