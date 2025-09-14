import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallComment } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallComment";

/**
 * Test unauthorized access to review comment details.
 *
 * This test validates that an unauthenticated user or a caller without
 * admin privileges attempting to access detailed information of a review
 * comment identified by reviewId and commentId is rejected with a 401
 * Unauthorized error.
 *
 * The test proceeds as follows:
 *
 * 1. Execute the prerequisite admin user join operation to establish an admin
 *    user context.
 * 2. Attempt to retrieve a comment detail by calling the endpoint without
 *    authenticating the connection (simulated by a fresh connection without
 *    authorization headers).
 * 3. Assert that the API call throws an HttpError with a 401 status code,
 *    indicating unauthorized access.
 *
 * This verifies that access to review comment details is properly
 * restricted to authenticated admin users only.
 */
export async function test_api_comment_at_unauthorized_access(
  connection: api.IConnection,
) {
  // 1. Prerequisite setup: Admin user join
  const adminUserCreate = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(32),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;
  await api.functional.auth.adminUser.join(connection, {
    body: adminUserCreate,
  });

  // 2. Create a fresh unauthenticated connection (no auth headers)
  const unauthConnection: api.IConnection = { ...connection, headers: {} };

  // 3. Attempt unauthorized access - expecting HttpError with 401 status
  await TestValidator.httpError(
    "unauthorized access to comment detail should fail",
    401,
    async () => {
      // Use random UUID-like strings for reviewId and commentId
      await api.functional.shoppingMall.adminUser.reviews.comments.at(
        unauthConnection,
        {
          reviewId: typia.random<string & tags.Format<"uuid">>(),
          commentId: typia.random<string & tags.Format<"uuid">>(),
        },
      );
    },
  );
}
