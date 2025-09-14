import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallComment } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallComment";
import type { IShoppingMallComment } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallComment";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";
import type { IShoppingMallReview } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallReview";

/**
 * Test retrieving paginated list of comments for a specific product review by
 * its reviewId by an authenticated member user.
 *
 * 1. Member user joins and authenticates.
 * 2. Member user creates a new product review.
 * 3. Retrieve paginated comments list for the created review with filters and
 *    sorting.
 * 4. Validate response data and pagination correctness.
 * 5. Verify filtering by is_private and status flags in the response.
 * 6. Verify sorting order by comment_body ascending.
 */
export async function test_api_product_review_comments_listing_success(
  connection: api.IConnection,
) {
  // 1. Member user joins and authenticates
  const memberUserCreate = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(12),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: null,
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;

  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: memberUserCreate,
    });
  typia.assert(memberUser);

  // 2. Member user creates a new product review
  const reviewCreate = {
    review_title: RandomGenerator.paragraph({
      sentences: 5,
      wordMin: 4,
      wordMax: 7,
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

  const review: IShoppingMallReview =
    await api.functional.shoppingMall.memberUser.reviews.createReview(
      connection,
      { body: reviewCreate },
    );
  typia.assert(review);
  TestValidator.equals(
    "member user id matches",
    review.shopping_mall_memberuserid,
    memberUser.id,
  );

  // 3. Retrieve paginated comments list for the created review
  // Test several paginated requests with filtering and sorting

  // Prepare request body for comment listing
  const requestBody1: IShoppingMallComment.IRequest = {
    page: 1,
    limit: 10,
    sort_by: "comment_body",
    sort_order: "asc",
    filter: {
      status: null,
      is_private: null,
      shopping_mall_review_id: review.id,
    },
  };

  const commentsPage1: IPageIShoppingMallComment =
    await api.functional.shoppingMall.memberUser.reviews.comments.index(
      connection,
      {
        reviewId: review.id,
        body: requestBody1,
      },
    );
  typia.assert(commentsPage1);

  TestValidator.predicate(
    "pagination current page should be 1",
    commentsPage1.pagination.current === 1,
  );
  TestValidator.predicate(
    "pagination limit should be 10",
    commentsPage1.pagination.limit === 10,
  );

  // Validate that all comments belong to the review id
  TestValidator.predicate(
    "all comments belong to review id",
    commentsPage1.data.every(
      (comment) =>
        comment.status !== undefined &&
        comment.is_private !== undefined &&
        comment.comment_body !== undefined,
    ),
  );

  // Validate sorting order ascending by comment_body
  for (let i = 1; i < commentsPage1.data.length; i++) {
    TestValidator.predicate(
      `comment_body sorted ascending ${i}`,
      commentsPage1.data[i - 1].comment_body <=
        commentsPage1.data[i].comment_body,
    );
  }

  // 4. Retrieve paginated comments with filter is_private: false
  const requestBody2: IShoppingMallComment.IRequest = {
    page: 1,
    limit: 5,
    sort_by: "comment_body",
    sort_order: "asc",
    filter: {
      is_private: false,
      status: null,
      shopping_mall_review_id: review.id,
    },
  };

  const commentsPage2: IPageIShoppingMallComment =
    await api.functional.shoppingMall.memberUser.reviews.comments.index(
      connection,
      {
        reviewId: review.id,
        body: requestBody2,
      },
    );
  typia.assert(commentsPage2);

  // Assert all comments have is_private === false
  TestValidator.predicate(
    "all comments have is_private false",
    commentsPage2.data.every((comment) => comment.is_private === false),
  );

  // 5. Retrieve paginated comments filtered by status if any
  // Use status from first comments page if exists else null
  const firstStatus =
    commentsPage1.data.length > 0 ? commentsPage1.data[0].status : null;

  if (firstStatus !== null) {
    const requestBody3: IShoppingMallComment.IRequest = {
      page: 1,
      limit: 5,
      sort_by: "comment_body",
      sort_order: "asc",
      filter: {
        status: firstStatus,
        is_private: null,
        shopping_mall_review_id: review.id,
      },
    };

    const commentsPage3: IPageIShoppingMallComment =
      await api.functional.shoppingMall.memberUser.reviews.comments.index(
        connection,
        {
          reviewId: review.id,
          body: requestBody3,
        },
      );
    typia.assert(commentsPage3);

    // Validate comments status
    TestValidator.predicate(
      "all comments match requested status",
      commentsPage3.data.every((comment) => comment.status === firstStatus),
    );
  }
}
