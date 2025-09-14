import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";
import type { IShoppingMallReview } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallReview";

/**
 * Test unauthorized access attempt to product review details.
 *
 * This test validates that the GET /shoppingMall/memberUser/reviews/{id} API
 * denies access when the requester is unauthenticated. Accessing detailed
 * review data without a valid token must be rejected with a 401 error to
 * protect customer privacy and maintain security.
 *
 * Workflow:
 *
 * 1. Perform member user account creation to satisfy system join dependency.
 * 2. Use the created connection but clear authentication headers to simulate an
 *    unauthenticated client.
 * 3. Attempt to fetch a review detail with a random UUID as review ID.
 * 4. Assert that the API throws an unauthorized error.
 *
 * This enforces confidentiality of product reviews preventing unauthorized data
 * access.
 */
export async function test_api_shopping_mall_review_at_unauthorized_access(
  connection: api.IConnection,
) {
  // Step 1: Create member user account (required dependency)
  const memberUserCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(12),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: null,
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;
  const authorizedMemberUser = await api.functional.auth.memberUser.join(
    connection,
    {
      body: memberUserCreateBody,
    },
  );
  typia.assert(authorizedMemberUser);

  // Step 2: Create an unauthorized connection by clearing headers
  const anonymousConn: api.IConnection = { ...connection, headers: {} };

  // Step 3: Use a random UUID for the review ID
  const testReviewId = typia.random<string & tags.Format<"uuid">>();

  // Step 4: Call the review detail endpoint with unauthorized connection expecting failure
  await TestValidator.error(
    "unauthorized access to review should fail",
    async () => {
      await api.functional.shoppingMall.memberUser.reviews.atReview(
        anonymousConn,
        {
          id: testReviewId,
        },
      );
    },
  );
}
