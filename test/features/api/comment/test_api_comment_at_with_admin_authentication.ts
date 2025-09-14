import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallComment } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallComment";

/**
 * This scenario validates successful retrieval of detailed information of a
 * specific comment linked to a product review by an admin user. It begins by
 * creating an admin user through the admin user join endpoint which establishes
 * the authentication context. The test then invokes the comment detail
 * retrieval endpoint with specific UUIDs for reviewId and commentId to obtain
 * the comment information. The test asserts that the returned comment matches
 * the IShoppingMallComment structure, validating aspects such as comment body
 * text content, privacy flag, and status fields. This ensures that an
 * authenticated admin user can retrieve accurate and expected comment details
 * associated with product reviews. The scenario therefore confirms
 * authentication flow, valid comment retrieval, and proper response structure
 * compliance.
 */
export async function test_api_comment_at_with_admin_authentication(
  connection: api.IConnection,
) {
  // Step 1: Admin user joins and authentication context is established
  const adminCreateInput = {
    email: `admin${typia.random<string & tags.Format<"email">>()}`.slice(0, 50),
    password_hash: RandomGenerator.alphaNumeric(20),
    nickname: RandomGenerator.name(2),
    full_name: RandomGenerator.name(3),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;
  const adminAuthorized: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminCreateInput,
    });
  typia.assert(adminAuthorized);

  // Step 2: Prepare UUIDs for reviewId and commentId to call the comment detail
  const reviewId = typia.random<string & tags.Format<"uuid">>();
  const commentId = typia.random<string & tags.Format<"uuid">>();

  // Step 3: Retrieve comment at /shoppingMall/adminUser/reviews/{reviewId}/comments/{commentId}
  const comment: IShoppingMallComment =
    await api.functional.shoppingMall.adminUser.reviews.comments.at(
      connection,
      {
        reviewId: reviewId,
        commentId: commentId,
      },
    );
  typia.assert(comment);

  // Step 4: Validate comment properties
  TestValidator.predicate(
    "comment property: comment_body is string",
    typeof comment.comment_body === "string",
  );
  TestValidator.predicate(
    "comment property: is_private is boolean",
    typeof comment.is_private === "boolean",
  );
  TestValidator.predicate(
    "comment property: status is string",
    typeof comment.status === "string",
  );
}
