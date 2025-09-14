import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallComment } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallComment";

/**
 * Validate the successful creation of a comment on a product review by an
 * admin user.
 *
 * This test ensures that an admin user can be created and authenticated
 * through the join operation. Then, the admin user posts a comment on a
 * specific product review identified by a randomly generated UUID as
 * reviewId. The comment includes required fields such as comment body,
 * privacy flag, and status. The test validates that the created comment
 * response correctly reflects the submitted data, confirming the
 * authorization context and functionality.
 *
 * Workflow:
 *
 * 1. Create and authenticate an admin user with proper required information.
 * 2. Generate a valid reviewId (UUID format) to associate the comment with.
 * 3. Construct a comment creation request with realistic content, privacy
 *    flag, and status.
 * 4. Post the comment using the adminUser authorized API endpoint.
 * 5. Assert response correctness using typia and TestValidator.
 */
export async function test_api_review_admin_create_comment_success(
  connection: api.IConnection,
) {
  // 1. Create and authenticate admin user
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: typia.random<string & tags.Format<"email">>(),
        password_hash: RandomGenerator.alphaNumeric(60),
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // 2. Generate a valid reviewId
  const reviewId: string & tags.Format<"uuid"> = typia.random<
    string & tags.Format<"uuid">
  >();

  // 3. Construct comment creation request body
  const requestBody = {
    comment_body: RandomGenerator.paragraph({
      sentences: 5,
      wordMin: 10,
      wordMax: 15,
    }),
    is_private: false,
    status: "visible",
  } satisfies IShoppingMallComment.ICreate;

  // 4. Post the comment
  const createdComment: IShoppingMallComment =
    await api.functional.shoppingMall.adminUser.reviews.comments.create(
      connection,
      {
        reviewId,
        body: requestBody,
      },
    );

  // 5. Assert the response types and values
  typia.assert(createdComment);
  TestValidator.equals(
    "comment body match",
    createdComment.comment_body,
    requestBody.comment_body,
  );
  TestValidator.equals(
    "is_private flag match",
    createdComment.is_private,
    requestBody.is_private,
  );
  TestValidator.equals(
    "status match",
    createdComment.status,
    requestBody.status,
  );
}
