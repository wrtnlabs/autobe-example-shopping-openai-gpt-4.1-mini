import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";
import type { IShoppingMallReview } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallReview";

/**
 * Validate the successful retrieval of a specific product review by ID for an
 * authenticated shopping mall member user.
 *
 * This test performs the following workflow:
 *
 * 1. Create (join) a new member user account with randomized credentials.
 * 2. Login as the created member user to establish authentication context.
 * 3. Attempt to retrieve a product review with a random UUID by ID.
 * 4. Validate the returned review entity matches the expected IShoppingMallReview
 *    type.
 *
 * Note: Since no review creation API is available, the test uses a random UUID
 * for the review ID. In a real system, this ID should correspond to an existing
 * review associated with the member user for meaningful tests.
 *
 * All API calls are awaited and fully type-checked.
 */
export async function test_api_shopping_mall_review_at_successful_retrieve_member_user(
  connection: api.IConnection,
) {
  // 1. Create member user with randomized data
  const email = typia.random<string & tags.Format<"email">>();
  const plainPassword = "password123";
  const passwordHash = plainPassword; // assuming password_hash is plain password string here
  const createBody = {
    email,
    password_hash: passwordHash,
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;
  const createdUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, { body: createBody });
  typia.assert(createdUser);

  // 2. Login as the created member user to obtain auth token
  const loginBody = {
    email,
    password: plainPassword,
  } satisfies IShoppingMallMemberUser.ILogin;
  const loggedInUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.login(connection, { body: loginBody });
  typia.assert(loggedInUser);

  // 3. Attempt to retrieve a product review using a random UUID (note: no creation API)
  const reviewId = typia.random<string & tags.Format<"uuid">>();
  const review: IShoppingMallReview =
    await api.functional.shoppingMall.memberUser.reviews.atReview(connection, {
      id: reviewId,
    });
  typia.assert(review);

  // 4. Validation - The test trusts the type assertion and does not perform further business logic checks
  TestValidator.predicate(
    "Retrieved review has valid rating",
    typeof review.rating === "number" && review.rating >= 0,
  );
}
