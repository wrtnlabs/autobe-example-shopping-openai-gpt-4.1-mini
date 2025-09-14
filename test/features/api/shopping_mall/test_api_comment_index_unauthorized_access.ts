import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallComment } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallComment";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallComment } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallComment";

/**
 * This test verifies that unauthorized access to review comments is denied.
 *
 * It performs the following steps:
 *
 * 1. Executes the adminUser join to establish an admin user in the system.
 * 2. Attempts to retrieve comments for a randomly generated review ID using an
 *    unauthenticated connection.
 * 3. Expects the API call to fail with a 401 Unauthorized error, confirming access
 *    control.
 */
export async function test_api_comment_index_unauthorized_access(
  connection: api.IConnection,
) {
  // 1. Ensure an adminUser joins (fulfill dependency for adminUser role presence)
  const adminUserCreate = {
    email: `user${RandomGenerator.alphaNumeric(5)}@test.com`,
    password_hash: RandomGenerator.alphaNumeric(10),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminUserCreate,
    });
  typia.assert(adminUser);

  // 2. Create a unauthorized connection by clearing headers to simulate no auth
  const unauthConn: api.IConnection = { ...connection, headers: {} };

  // 3. Attempt to access comments with the unauthenticated connection
  // Generate a random reviewId (UUID format)
  const reviewId: string & tags.Format<"uuid"> = typia.random<
    string & tags.Format<"uuid">
  >();

  // Prepare a valid but random IShoppingMallComment.IRequest body
  // Using null values for optional properties explicitly
  const commentRequest = {
    page: 1,
    limit: 10,
    sort_by: null,
    sort_order: null,
    filter: null,
  } satisfies IShoppingMallComment.IRequest;

  // 4. Expect the API call to throw an HTTP 401 Unauthorized error
  await TestValidator.error(
    "Unauthorized client should not access review comments",
    async () => {
      await api.functional.shoppingMall.adminUser.reviews.comments.index(
        unauthConn,
        {
          reviewId,
          body: commentRequest,
        },
      );
    },
  );
}
