import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";
import type { IShoppingMallReview } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallReview";

/**
 * Test the successful update of a product review by an authenticated member
 * user.
 *
 * This test covers the following scenario:
 *
 * 1. A new member user joins the shopping mall system.
 * 2. The member user creates a new product review.
 * 3. The member user updates the review's title, body, rating, privacy status,
 *    and overall status.
 * 4. The test asserts that the updated review fields match the update request.
 *
 * All API calls are properly awaited, responses type-asserted, and the
 * update is validated thoroughly. Authentication tokens are managed
 * automatically by the SDK.
 */
export async function test_api_product_review_update_success(
  connection: api.IConnection,
) {
  // 1. Register a new member user
  const memberUserEmail: string = typia.random<string & tags.Format<"email">>();
  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: {
        email: memberUserEmail,
        password_hash: "securePassword123!",
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        phone_number: RandomGenerator.mobile(),
        status: "active",
      } satisfies IShoppingMallMemberUser.ICreate,
    });
  typia.assert(memberUser);

  // 2. Create a product review by the new member user
  const createReviewBody = {
    review_title: RandomGenerator.paragraph({
      sentences: 3,
      wordMin: 5,
      wordMax: 10,
    }),
    review_body: RandomGenerator.content({
      paragraphs: 2,
      sentenceMin: 10,
      sentenceMax: 15,
      wordMin: 4,
      wordMax: 8,
    }),
    rating: typia.random<
      number & tags.Type<"int32"> & tags.Minimum<1> & tags.Maximum<5>
    >(),
    is_private: false,
  } satisfies IShoppingMallReview.ICreate;

  const createdReview: IShoppingMallReview =
    await api.functional.shoppingMall.memberUser.reviews.createReview(
      connection,
      {
        body: createReviewBody,
      },
    );
  typia.assert(createdReview);

  // 3. Prepare review update data with new content
  const updateReviewBody = {
    review_title: RandomGenerator.paragraph({
      sentences: 4,
      wordMin: 6,
      wordMax: 12,
    }),
    review_body: RandomGenerator.content({
      paragraphs: 3,
      sentenceMin: 15,
      sentenceMax: 20,
      wordMin: 5,
      wordMax: 10,
    }),
    rating: typia.random<
      number & tags.Type<"int32"> & tags.Minimum<1> & tags.Maximum<5>
    >(),
    is_private: true,
    status: "approved",
  } satisfies IShoppingMallReview.IUpdate;

  // 4. Update the review
  const updatedReview: IShoppingMallReview =
    await api.functional.shoppingMall.memberUser.reviews.updateReview(
      connection,
      {
        id: createdReview.id,
        body: updateReviewBody,
      },
    );
  typia.assert(updatedReview);

  // 5. Validate that the updated fields match
  TestValidator.equals(
    "review id remains unchanged",
    updatedReview.id,
    createdReview.id,
  );
  TestValidator.equals(
    "review title updated correctly",
    updatedReview.review_title,
    updateReviewBody.review_title,
  );
  TestValidator.equals(
    "review body updated correctly",
    updatedReview.review_body,
    updateReviewBody.review_body,
  );
  TestValidator.equals(
    "rating updated correctly",
    updatedReview.rating,
    updateReviewBody.rating,
  );
  TestValidator.equals(
    "privacy flag updated correctly",
    updatedReview.is_private,
    updateReviewBody.is_private,
  );
  TestValidator.equals(
    "status updated correctly",
    updatedReview.status,
    updateReviewBody.status,
  );
}
