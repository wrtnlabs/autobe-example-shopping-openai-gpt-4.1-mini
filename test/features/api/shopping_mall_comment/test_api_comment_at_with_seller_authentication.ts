import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallComment } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallComment";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * This E2E test validates that a seller user can successfully sign up and
 * authenticate via the join endpoint, which will automatically establish
 * authorization headers for subsequent requests.
 *
 * Then, it tests the retrieval of a specific comment on a product review by
 * using valid UUID reviewId and commentId.
 *
 * The test asserts that the returned comment payload has the expected
 * structure and property types as defined in IShoppingMallComment.
 *
 * The test covers full happy path for seller user authentication and
 * comment retrieval.
 */
export async function test_api_comment_at_with_seller_authentication(
  connection: api.IConnection,
) {
  // 1. Seller user join and authentication
  const sellerUserCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password: RandomGenerator.alphaNumeric(16),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    phone_number: null,
    business_registration_number: RandomGenerator.alphaNumeric(10),
  } satisfies IShoppingMallSellerUser.ICreate;

  const authorizedSellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: sellerUserCreateBody,
    });
  typia.assert(authorizedSellerUser);

  // 2. Generate UUIDs for reviewId and commentId
  const reviewId = typia.random<string & tags.Format<"uuid">>();
  const commentId = typia.random<string & tags.Format<"uuid">>();

  // 3. Fetch the targeted comment by seller user auth
  const comment: IShoppingMallComment =
    await api.functional.shoppingMall.sellerUser.reviews.comments.at(
      connection,
      {
        reviewId,
        commentId,
      },
    );
  typia.assert(comment);

  // 4. Validate the returned comment data
  TestValidator.predicate(
    "comment_body is string",
    typeof comment.comment_body === "string",
  );
  TestValidator.predicate(
    "is_private is boolean",
    typeof comment.is_private === "boolean",
  );
  TestValidator.predicate(
    "status is string",
    typeof comment.status === "string",
  );
}
