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
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * This scenario tests listing comments on a product review by its reviewId from
 * the perspective of an authenticated seller user. The test workflow includes:
 *
 * 1. Seller user registration (join) with all required credentials such as email,
 *    password, nickname, full name, phone number, and unique business
 *    registration number, ensuring complete authentication context.
 * 2. Seller user login to establish the session and authorization context for
 *    seller operations.
 * 3. Member user registration (join) with required credentials including email,
 *    password hash, nickname, full name, phone number, and status to create a
 *    valid member user.
 * 4. Member user login for the member user to create the authentication context
 *    necessary for review creation.
 * 5. Creation of a product review by the member user using the review creation
 *    API, providing realistic review data such as title, body, rating, and
 *    privacy flag.
 * 6. Using the reviewId from the created review, the test switches back to the
 *    seller user role and retrieves a filtered, paginated list of comments
 *    associated with the review via the seller API for comments listing.
 * 7. The test includes validation steps confirming that the returned comment page
 *    includes correct pagination information and each comment fulfills privacy
 *    and status conditions as expected from a seller's perspective. The
 *    scenario ensures roles switch properly between member and seller users,
 *    tests authentic review creation, and verifies seller access and filtering
 *    capabilities for comments on that review. All required fields are
 *    populated with plausible random data using typia and RandomGenerator
 *    utilities, and every API response is asserted for type correctness with
 *    typia.assert. Business rules that private comments are only visible to
 *    authorized users are implicitly tested by fetching comments with filters
 *    including privacy flags.
 */
export async function test_api_product_review_comments_listing_seller_access(
  connection: api.IConnection,
) {
  // 1. Seller user registration
  const sellerEmail = typia.random<string & tags.Format<"email">>();
  const seller: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: {
        email: sellerEmail,
        password: "P@ssword123!",
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(2),
        phone_number: RandomGenerator.mobile(),
        business_registration_number: RandomGenerator.alphaNumeric(10),
      } satisfies IShoppingMallSellerUser.ICreate,
    });
  typia.assert(seller);

  // 2. Seller user login
  await api.functional.auth.sellerUser.login(connection, {
    body: {
      email: sellerEmail,
      password: "P@ssword123!",
    } satisfies IShoppingMallSellerUser.ILogin,
  });

  // 3. Member user registration
  const memberEmail = typia.random<string & tags.Format<"email">>();
  const memberCreateBody = {
    email: memberEmail,
    password_hash: "secure_password123",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: RandomGenerator.mobile(),
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;
  const member: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: memberCreateBody,
    });
  typia.assert(member);

  // 4. Member user login
  await api.functional.auth.memberUser.login(connection, {
    body: {
      email: memberEmail,
      password: "secure_password123",
    } satisfies IShoppingMallMemberUser.ILogin,
  });

  // 5. Member user creates a product review
  const reviewCreateBody = {
    review_title: RandomGenerator.paragraph({ sentences: 5 }),
    review_body: RandomGenerator.content({ paragraphs: 2 }),
    rating: typia.random<
      number & tags.Type<"int32"> & tags.Minimum<1> & tags.Maximum<5>
    >(),
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

  // 6. Switch back to seller user for comment listing
  await api.functional.auth.sellerUser.login(connection, {
    body: {
      email: sellerEmail,
      password: "P@ssword123!",
    } satisfies IShoppingMallSellerUser.ILogin,
  });

  // 7. Seller user lists comments for the created review
  const commentListBody = {
    page: 1,
    limit: 10,
    sort_by: "created_at",
    sort_order: "desc",
    filter: {
      is_private: false,
      status: "visible",
      shopping_mall_review_id: review.id,
    },
  } satisfies IShoppingMallComment.IRequest;

  const commentPage: IPageIShoppingMallComment =
    await api.functional.shoppingMall.sellerUser.reviews.comments.index(
      connection,
      {
        reviewId: review.id,
        body: commentListBody,
      },
    );
  typia.assert(commentPage);

  // Validate pagination info
  TestValidator.predicate(
    "pagination has positive current page",
    commentPage.pagination.current > 0,
  );
  TestValidator.predicate(
    "pagination limit is positive",
    commentPage.pagination.limit > 0,
  );
  TestValidator.predicate(
    "pagination total records non-negative",
    commentPage.pagination.records >= 0,
  );
  TestValidator.predicate(
    "pagination total pages valid",
    commentPage.pagination.pages >= 0,
  );

  // Validate each comment
  for (const comment of commentPage.data) {
    typia.assert(comment);

    // Only comments matching the filter criteria are returned
    TestValidator.equals("comment is private flag", comment.is_private, false);
    TestValidator.equals("comment status", comment.status, "visible");

    // Comment body is non-empty string
    TestValidator.predicate(
      "comment body non-empty",
      typeof comment.comment_body === "string" &&
        comment.comment_body.length > 0,
    );
  }
}
