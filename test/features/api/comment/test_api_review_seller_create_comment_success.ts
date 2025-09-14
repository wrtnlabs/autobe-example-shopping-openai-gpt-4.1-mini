import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallComment } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallComment";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * Test that a seller user can successfully create a comment on a specific
 * product review.
 *
 * This test ensures that the seller user registration (join) API works
 * properly, establishing authentication for the seller user role, followed
 * by creating a comment on a given review ID with valid content and privacy
 * flags. The created comment is validated to confirm response correctness
 * and data integrity.
 *
 * Steps:
 *
 * 1. Register a new seller user with valid information via the join endpoint.
 * 2. Generate a valid reviewId UUID to associate the comment with an existing
 *    review.
 * 3. Construct a valid comment creation request body with comment content and
 *    privacy flag.
 * 4. Call the comment creation API with the reviewId and comment body.
 * 5. Confirm the response matches the expected comment structure.
 * 6. Validate critical fields (comment_body, is_private, status) against the
 *    request.
 *
 * This test confirms the core functionality of comment creation by
 * authorized seller users, verifying end-to-end request/response flow and
 * server validation.
 */
export async function test_api_review_seller_create_comment_success(
  connection: api.IConnection,
) {
  // 1. Register seller user (join API) with valid IShoppingMallSellerUser.ICreate data
  const sellerCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password: "P@ssword123!",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: null,
    business_registration_number: `BRN${RandomGenerator.alphaNumeric(9)}`,
  } satisfies IShoppingMallSellerUser.ICreate;

  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: sellerCreateBody,
    });
  typia.assert(sellerUser);

  // 2. Generate valid UUID for reviewId (linked to existing review, hypothetical)
  const reviewId: string & tags.Format<"uuid"> = typia.random<
    string & tags.Format<"uuid">
  >();

  // 3. Construct valid comment create request body
  const commentCreateBody = {
    comment_body: RandomGenerator.paragraph({ sentences: 5 }),
    is_private: false,
    status: "visible",
    parent_comment_id: null,
    shopping_mall_inquiry_id: null,
    shopping_mall_review_id: reviewId,
    shopping_mall_memberuserid: null,
    shopping_mall_guestuserid: null,
    shopping_mall_selleruserid: sellerUser.id,
  } satisfies IShoppingMallComment.ICreate;

  // 4. Call comment creation API
  const comment: IShoppingMallComment =
    await api.functional.shoppingMall.sellerUser.reviews.comments.create(
      connection,
      {
        reviewId,
        body: commentCreateBody,
      },
    );
  typia.assert(comment);

  // 5. Validate response fields against input
  TestValidator.equals(
    "created comment body matches input",
    comment.comment_body,
    commentCreateBody.comment_body,
  );

  TestValidator.equals(
    "created comment is_private matches input",
    comment.is_private,
    commentCreateBody.is_private,
  );

  TestValidator.equals(
    "created comment status is 'visible'",
    comment.status,
    "visible",
  );
}
