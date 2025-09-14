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
 * This scenario verifies that an admin user can successfully retrieve a
 * paginated list of comments for a specific product review, identified by
 * reviewId. It tests filtering, sorting, and pagination features by
 * providing realistic request parameters. Authentication context for
 * adminUser is established via join operation. The test includes verifying
 * correct pagination metadata and that all comments returned belong to the
 * specified review, respecting private comment visibility rules.
 */
export async function test_api_comment_index_with_admin_authentication(
  connection: api.IConnection,
) {
  // 1. Create and authenticate an admin user
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: typia.random<string & tags.Format<"email">>(),
        password_hash: RandomGenerator.alphaNumeric(32),
        nickname: RandomGenerator.name(),
        full_name: `${RandomGenerator.name()} ${RandomGenerator.name()}`,
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // 2. Generate a random valid review ID
  const reviewId: string & tags.Format<"uuid"> = typia.random<
    string & tags.Format<"uuid">
  >();

  // 3. Construct request body for comments filtering and pagination with realistic values
  const requestBody = {
    page: 1,
    limit: 10,
    sort_by: "created_at",
    sort_order: "desc" as "desc",
    filter: {
      shopping_mall_review_id: reviewId,
      status: "visible",
      is_private: null,
      search: null,
      shopping_mall_inquiry_id: null,
      shopping_mall_memberuserid: null,
    },
  } satisfies IShoppingMallComment.IRequest;

  // 4. Call the API to retrieve paginated comments list for the review
  const pagingComments: IPageIShoppingMallComment =
    await api.functional.shoppingMall.adminUser.reviews.comments.index(
      connection,
      {
        reviewId: reviewId,
        body: requestBody,
      },
    );
  typia.assert(pagingComments);

  // 5. Verify pagination metadata
  TestValidator.predicate(
    "pagination current page is positive integer",
    typeof pagingComments.pagination.current === "number" &&
      pagingComments.pagination.current > 0,
  );
  TestValidator.predicate(
    "pagination limit is positive integer",
    typeof pagingComments.pagination.limit === "number" &&
      pagingComments.pagination.limit > 0,
  );
  TestValidator.predicate(
    "pagination pages is positive integer",
    typeof pagingComments.pagination.pages === "number" &&
      pagingComments.pagination.pages >= 0,
  );
  TestValidator.predicate(
    "pagination records is non-negative integer",
    typeof pagingComments.pagination.records === "number" &&
      pagingComments.pagination.records >= 0,
  );

  // 6. Verify all comments in data respect privacy and status filters
  for (const comment of pagingComments.data) {
    if (
      requestBody.filter?.is_private !== null &&
      requestBody.filter?.is_private !== undefined
    ) {
      TestValidator.equals(
        "comment is_private matches filter",
        comment.is_private,
        requestBody.filter.is_private,
      );
    }
    if (
      requestBody.filter?.status !== null &&
      requestBody.filter?.status !== undefined
    ) {
      TestValidator.equals(
        "comment status matches filter",
        comment.status,
        requestBody.filter.status,
      );
    }
  }
}
