import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallComment } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallComment";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * This test validates the successful update of a product review comment by a
 * seller user. It ensures that the seller user can update the comment_body,
 * is_private, and status fields successfully. The test involves seller user
 * creation, user login, and two sequential updates on the same comment. It
 * asserts the API responses and verifies that the updated comment data matches
 * the update requests.
 */
export async function test_api_seller_review_comment_update_success(
  connection: api.IConnection,
) {
  // 1. Create a seller user with realistic data
  const sellerUserCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password: "ComplexP@ss123!",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    phone_number: RandomGenerator.mobile(),
    business_registration_number: "BRN" + RandomGenerator.alphaNumeric(9),
  } satisfies IShoppingMallSellerUser.ICreate;

  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: sellerUserCreateBody,
    });
  typia.assert(sellerUser);

  // 2. Login the seller user to establish authentication context
  const sellerUserLoginBody = {
    email: sellerUserCreateBody.email,
    password: sellerUserCreateBody.password,
  } satisfies IShoppingMallSellerUser.ILogin;

  const sellerUserLoggedIn: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.login(connection, {
      body: sellerUserLoginBody,
    });
  typia.assert(sellerUserLoggedIn);

  // 3. Generate realistic UUIDs for reviewId and commentId as existing comment identifiers
  const reviewId = typia.random<string & tags.Format<"uuid">>();
  const commentId = typia.random<string & tags.Format<"uuid">>();

  // 4. First update to the review comment with new comment_body, is_private, and status
  const firstUpdateBody = {
    comment_body: RandomGenerator.paragraph({ sentences: 5 }),
    is_private: true,
    status: "visible",
  } satisfies IShoppingMallComment.IUpdate;

  const updatedComment1: IShoppingMallComment =
    await api.functional.shoppingMall.sellerUser.reviews.comments.update(
      connection,
      {
        reviewId: reviewId,
        commentId: commentId,
        body: firstUpdateBody,
      },
    );
  typia.assert(updatedComment1);

  // 5. Validate updated comment fields reflect the first update
  TestValidator.equals(
    "comment body matches first update",
    updatedComment1.comment_body,
    firstUpdateBody.comment_body,
  );
  TestValidator.equals(
    "is_private matches first update",
    updatedComment1.is_private,
    firstUpdateBody.is_private,
  );
  TestValidator.equals(
    "status matches first update",
    updatedComment1.status,
    firstUpdateBody.status,
  );

  // 6. Second update with different comment_body, is_private, and status
  const secondUpdateBody = {
    comment_body: RandomGenerator.paragraph({ sentences: 3 }),
    is_private: false,
    status: "hidden",
  } satisfies IShoppingMallComment.IUpdate;

  const updatedComment2: IShoppingMallComment =
    await api.functional.shoppingMall.sellerUser.reviews.comments.update(
      connection,
      {
        reviewId: reviewId,
        commentId: commentId,
        body: secondUpdateBody,
      },
    );
  typia.assert(updatedComment2);

  // 7. Validate updated comment fields reflect the second update
  TestValidator.equals(
    "comment body matches second update",
    updatedComment2.comment_body,
    secondUpdateBody.comment_body,
  );
  TestValidator.equals(
    "is_private matches second update",
    updatedComment2.is_private,
    secondUpdateBody.is_private,
  );
  TestValidator.equals(
    "status matches second update",
    updatedComment2.status,
    secondUpdateBody.status,
  );
}
