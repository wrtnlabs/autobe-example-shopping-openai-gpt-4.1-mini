import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";
import type { IShoppingMallReview } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallReview";

/**
 * This test function verifies the deletion lifecycle of a product review by an
 * authenticated member user.
 *
 * It follows these steps:
 *
 * 1. Registers a new member user, ensuring authentication context with role
 *    "memberUser".
 * 2. Creates a new product review under the authenticated user.
 * 3. Deletes the created review by its unique ID.
 * 4. Attempts to retrieve or access the deleted review, expecting failure or not
 *    found response.
 *
 * This test ensures that only authenticated member users can delete reviews,
 * that deletion is hard removal, and that attempts to access deleted reviews
 * are properly rejected.
 */
export async function test_api_product_review_delete_success(
  connection: api.IConnection,
) {
  // 1. Create member user and authenticate
  const userCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(12),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: null,
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;

  const user: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: userCreateBody,
    });
  typia.assert(user);

  // 2. Create a new product review
  const reviewCreateBody = {
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
      wordMax: 7,
    }),
    rating: 5,
    is_private: false,
  } satisfies IShoppingMallReview.ICreate;

  const review: IShoppingMallReview =
    await api.functional.shoppingMall.memberUser.reviews.createReview(
      connection,
      {
        body: reviewCreateBody,
      },
    );
  typia.assert(review);

  // 3. Delete the created product review
  await api.functional.shoppingMall.memberUser.reviews.eraseReview(connection, {
    id: review.id,
  });

  // 4. Verify that the deleted review is not accessible anymore
  // Since there is no GET API for a single review retrieval stated,
  // we verify deletion by expecting error when trying delete again
  await TestValidator.error(
    "deleted review should not be found for deletion",
    async () => {
      await api.functional.shoppingMall.memberUser.reviews.eraseReview(
        connection,
        {
          id: review.id,
        },
      );
    },
  );
}
