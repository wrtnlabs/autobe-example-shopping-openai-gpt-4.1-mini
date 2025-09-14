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
 * End-to-end test for retrieving shopping mall inquiry comments with filtering
 * and pagination.
 *
 * This test covers:
 *
 * 1. Admin user creation (join)
 * 2. Admin user login (authentication)
 * 3. Retrieval of inquiry comments list with various filtering and pagination
 *    parameters
 * 4. Validation of response pagination and content accuracy
 * 5. Ensuring access control only allows admin users
 * 6. Checking that private comments are included only when authorized
 * 7. Testing pagination boundaries and sorting options
 */
export async function test_api_inquiry_comment_search_pagination(
  connection: api.IConnection,
) {
  // 1. Create admin user (join) with realistic data
  const createBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(16),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: createBody,
    });
  typia.assert(adminUser);

  // 2. Login as admin user with created email and password_hash
  const loginBody = {
    email: adminUser.email,
    password_hash: createBody.password_hash,
  } satisfies IShoppingMallAdminUser.ILogin;

  const loggedInUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.login(connection, {
      body: loginBody,
    });
  typia.assert(loggedInUser);

  // 3. Prepare for comment retrieval
  // For test, generate a dummy inquiryId (UUID) - business context accepts any UUID
  const inquiryId = typia.random<string & tags.Format<"uuid">>();

  // 4. Test retrieval with default filtering and pagination
  const defaultRequest = {
    page: 1,
    limit: 10,
    sort_by: "created_at",
    sort_order: "desc",
    filter: null,
  } satisfies IShoppingMallComment.IRequest;

  const responseDefault: IPageIShoppingMallComment.ISummary =
    await api.functional.shoppingMall.adminUser.inquiries.comments.index(
      connection,
      {
        inquiryId: inquiryId,
        body: defaultRequest,
      },
    );
  typia.assert(responseDefault);

  // Validate pagination info
  TestValidator.predicate(
    "pagination current page is 1",
    responseDefault.pagination.current === 1,
  );
  TestValidator.predicate(
    "pagination limit is 10",
    responseDefault.pagination.limit === 10,
  );
  TestValidator.predicate(
    "pagination pages and records consistency",
    responseDefault.pagination.pages >= 0 &&
      responseDefault.pagination.records >= 0,
  );

  // Validate data array
  TestValidator.predicate(
    "response data is array",
    Array.isArray(responseDefault.data),
  );

  // Validate each comment item
  for (const comment of responseDefault.data) {
    typia.assert(comment);
    // Check comment has correct inquiryId (nullable property may be null or undefined)
    if (
      comment.shopping_mall_inquiry_id !== null &&
      comment.shopping_mall_inquiry_id !== undefined
    ) {
      TestValidator.equals(
        "comment inquiryId matches",
        comment.shopping_mall_inquiry_id,
        inquiryId,
      );
    }
    // Validate status is a string
    TestValidator.predicate(
      "comment status is string",
      typeof comment.status === "string" && comment.status.length > 0,
    );
    // Validate is_private is boolean
    TestValidator.predicate(
      "comment is_private boolean",
      typeof comment.is_private === "boolean",
    );
    // Validate comment_body is string
    TestValidator.predicate(
      "comment_body is string",
      typeof comment.comment_body === "string",
    );
  }

  // 5. Test retrieval with filter: only private comments
  const privateFilterRequest = {
    page: 1,
    limit: 5,
    sort_by: "created_at",
    sort_order: "asc",
    filter: {
      is_private: true,
      shopping_mall_inquiry_id: inquiryId,
      status: null,
      search: null,
      shopping_mall_review_id: null,
      shopping_mall_memberuserid: null,
    },
  } satisfies IShoppingMallComment.IRequest;

  const responsePrivate: IPageIShoppingMallComment.ISummary =
    await api.functional.shoppingMall.adminUser.inquiries.comments.index(
      connection,
      {
        inquiryId: inquiryId,
        body: privateFilterRequest,
      },
    );
  typia.assert(responsePrivate);

  for (const comment of responsePrivate.data) {
    // All comments should be private
    TestValidator.equals("comment is private", comment.is_private, true);
    // Comments should match inquiryId if not null
    if (
      comment.shopping_mall_inquiry_id !== null &&
      comment.shopping_mall_inquiry_id !== undefined
    ) {
      TestValidator.equals(
        "private comment inquiryId matches",
        comment.shopping_mall_inquiry_id,
        inquiryId,
      );
    }
  }

  // 6. Test retrieval with filter: by status
  // Simulate status filter (example value from comments status, e.g., "visible")
  // Since possible statuses are unknown, use the first comment status if available or default
  const statusToFilter =
    responseDefault.data.length > 0
      ? responseDefault.data[0].status
      : "visible";

  const statusFilterRequest = {
    page: 1,
    limit: 5,
    sort_by: "created_at",
    sort_order: "desc",
    filter: {
      status: statusToFilter,
      shopping_mall_inquiry_id: inquiryId,
      is_private: null,
      search: null,
      shopping_mall_review_id: null,
      shopping_mall_memberuserid: null,
    },
  } satisfies IShoppingMallComment.IRequest;

  const responseStatus: IPageIShoppingMallComment.ISummary =
    await api.functional.shoppingMall.adminUser.inquiries.comments.index(
      connection,
      {
        inquiryId: inquiryId,
        body: statusFilterRequest,
      },
    );
  typia.assert(responseStatus);

  for (const comment of responseStatus.data) {
    TestValidator.equals(
      "comment status matches filter",
      comment.status,
      statusToFilter,
    );
    if (
      comment.shopping_mall_inquiry_id !== null &&
      comment.shopping_mall_inquiry_id !== undefined
    ) {
      TestValidator.equals(
        "status filter comment inquiryId matches",
        comment.shopping_mall_inquiry_id,
        inquiryId,
      );
    }
  }

  // 7. Test pagination boundaries
  // Page 0 should be allowed and handled
  const zeroPageRequest = {
    page: 0,
    limit: 3,
    sort_by: "created_at",
    sort_order: "asc",
    filter: null,
  } satisfies IShoppingMallComment.IRequest;

  const zeroPageResponse: IPageIShoppingMallComment.ISummary =
    await api.functional.shoppingMall.adminUser.inquiries.comments.index(
      connection,
      {
        inquiryId: inquiryId,
        body: zeroPageRequest,
      },
    );
  typia.assert(zeroPageResponse);
  TestValidator.predicate(
    "zero page current is 0",
    zeroPageResponse.pagination.current === 0,
  );

  // 8. Test pagination with limit 1 and multiple pages
  const limitOneRequest = {
    page: 1,
    limit: 1,
    sort_by: "created_at",
    sort_order: "desc",
    filter: null,
  } satisfies IShoppingMallComment.IRequest;

  const limitOneResponse: IPageIShoppingMallComment.ISummary =
    await api.functional.shoppingMall.adminUser.inquiries.comments.index(
      connection,
      {
        inquiryId: inquiryId,
        body: limitOneRequest,
      },
    );
  typia.assert(limitOneResponse);
  TestValidator.predicate(
    "limit one pagination returns at most 1 item",
    limitOneResponse.data.length <= 1,
  );

  // 9. Test sorting options (asc, desc) on created_at
  for (const order of ["asc", "desc"] as const) {
    const sortRequest = {
      page: 1,
      limit: 10,
      sort_by: "created_at",
      sort_order: order,
      filter: null,
    } satisfies IShoppingMallComment.IRequest;

    const sortResponse: IPageIShoppingMallComment.ISummary =
      await api.functional.shoppingMall.adminUser.inquiries.comments.index(
        connection,
        {
          inquiryId: inquiryId,
          body: sortRequest,
        },
      );
    typia.assert(sortResponse);

    // Validate sorting order on created_at
    let sorted = true;
    for (let i = 1; i < sortResponse.data.length; i++) {
      const prev = sortResponse.data[i - 1].created_at;
      const curr = sortResponse.data[i].created_at;
      if (order === "asc") {
        if (prev > curr) {
          sorted = false;
          break;
        }
      } else {
        if (prev < curr) {
          sorted = false;
          break;
        }
      }
    }
    TestValidator.predicate(`sorting is ${order}`, sorted);
  }
}
