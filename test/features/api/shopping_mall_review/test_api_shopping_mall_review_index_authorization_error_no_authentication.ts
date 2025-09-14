import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallReview } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallReview";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";
import type { IShoppingMallReview } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallReview";

/**
 * This End-to-End test function verifies that the API correctly handles
 * attempts to retrieve a paginated list of product reviews via PATCH
 * /shoppingMall/memberUser/reviews endpoint by an unauthorized client
 * without valid authentication credentials.
 *
 * Business Context: The memberUser role is required to authenticate
 * requests to access member-only review listings. This test ensures that
 * unauthorized requests are rejected, maintaining data security and
 * preventing anonymous access to sensitive review data.
 *
 * Test Steps:
 *
 * 1. Create a member user via POST /auth/memberUser/join to establish
 *    authorization context.
 * 2. Attempt to retrieve the product reviews list without sending
 *    authorization tokens.
 * 3. Confirm that an authorization error is thrown due to missing
 *    authentication.
 *
 * The test validates that the system correctly enforces authorization by
 * rejecting unauthorized access attempts, thereby securing member-only
 * review data from data leaks.
 */
export async function test_api_shopping_mall_review_index_authorization_error_no_authentication(
  connection: api.IConnection,
) {
  // 1. Create a member user via POST /auth/memberUser/join
  const userCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(16),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    phone_number: null,
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;
  const authorizedUser = await api.functional.auth.memberUser.join(connection, {
    body: userCreateBody,
  });
  typia.assert(authorizedUser);

  // 2. Attempt to retrieve the product reviews list without authorization
  const reviewRequestBody = {
    page: null,
    limit: null,
    review_title: null,
    min_rating: null,
    max_rating: null,
    status: null,
  } satisfies IShoppingMallReview.IRequest;

  await TestValidator.error(
    "Unauthorized access to reviews list should fail",
    async () => {
      await api.functional.shoppingMall.memberUser.reviews.indexReview(
        { ...connection, headers: {} }, // No authentication headers
        {
          body: reviewRequestBody,
        },
      );
    },
  );
}
