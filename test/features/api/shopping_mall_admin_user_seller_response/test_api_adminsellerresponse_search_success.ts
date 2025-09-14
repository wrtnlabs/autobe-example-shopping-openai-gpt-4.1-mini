import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallSellerResponse } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallSellerResponse";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallSellerResponse } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerResponse";

/**
 * This E2E test function validates that an administrator can successfully
 * retrieve a paginated list of seller responses through the PATCH
 * /shoppingMall/adminUser/sellerResponses API endpoint. The test first creates
 * a new admin user by calling the admin user join endpoint, authenticating and
 * setting the authorization token in the connection. Then it tests the
 * sellerResponses.index API with typical request filtering options such as
 * page, limit, is_private, and status. The test asserts that the response is a
 * well-typed paginated structure containing a list of seller responses along
 * with pagination metadata, verifying that the returned pagination properties
 * have valid values and that the seller responses have all required properties
 * including id, related inquiry or review ids, seller user id, content, privacy
 * flag, status, and timestamps. This ensures that the admin user authentication
 * works and that pagination, filtering, and data retrieval for seller responses
 * operate correctly. The test covers realistic data validation using generated
 * random request filters within acceptable ranges and verifies the integrity
 * and completeness of the returned data structure using typia.assert and
 * TestValidator equals checks on pagination counts and logical value ranges.
 */
export async function test_api_adminsellerresponse_search_success(
  connection: api.IConnection,
) {
  // 1. Admin user creation and authentication
  const adminUserEmail = typia.random<string & tags.Format<"email">>();
  const adminUserStatus = "active";
  const adminUserCreateBody = {
    email: adminUserEmail,
    password_hash: "hashed_password_123",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    status: adminUserStatus,
  } satisfies IShoppingMallAdminUser.ICreate;

  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminUserCreateBody,
    });
  typia.assert(adminUser);

  // 2. Prepare seller response search request body
  const requestBody: IShoppingMallSellerResponse.IRequest = {
    page: typia.random<
      number & tags.Type<"int32"> & tags.Minimum<0>
    >() satisfies number as number | null,
    limit: typia.random<
      number & tags.Type<"int32"> & tags.Minimum<0>
    >() satisfies number as number | null,
    is_private: RandomGenerator.pick([true, false]),
    status: RandomGenerator.pick(["published", "draft", "deleted"]),
    search: RandomGenerator.substring(
      "seller response content for testing pagination and filters",
    ),
  };

  // 3. Call seller responses listing with filters
  const response: IPageIShoppingMallSellerResponse =
    await api.functional.shoppingMall.adminUser.sellerResponses.index(
      connection,
      {
        body: requestBody,
      },
    );
  typia.assert(response);

  // 4. Validate pagination metadata
  const pagination = response.pagination;
  TestValidator.predicate(
    "pagination current page is non-negative",
    pagination.current >= 0,
  );
  TestValidator.predicate("pagination limit is positive", pagination.limit > 0);
  TestValidator.predicate(
    "pagination records count non-negative",
    pagination.records >= 0,
  );
  TestValidator.predicate(
    "pagination pages count non-negative",
    pagination.pages >= 0,
  );
  TestValidator.equals(
    "pagination pages count equals correct pages",
    pagination.pages,
    Math.ceil(pagination.records / pagination.limit),
  );
  if (requestBody.limit !== null && requestBody.limit !== undefined) {
    TestValidator.predicate(
      "response data length does not exceed limit",
      response.data.length <= requestBody.limit,
    );
  }

  // 5. Validate each seller response entry
  for (const sellerResponse of response.data) {
    typia.assert(sellerResponse);
    TestValidator.predicate(
      "sellerResponse.id is UUID",
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        sellerResponse.id,
      ),
    );

    // Nullable linked inquiry ID or explicit null
    TestValidator.predicate(
      "linked inquiry id is UUID or null",
      sellerResponse.shopping_mall_inquiry_id === null ||
        typeof sellerResponse.shopping_mall_inquiry_id === "string",
    );
    // Nullable linked review ID or explicit null
    TestValidator.predicate(
      "linked review id is UUID or null",
      sellerResponse.shopping_mall_review_id === null ||
        typeof sellerResponse.shopping_mall_review_id === "string",
    );

    TestValidator.predicate(
      "seller user id is UUID",
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        sellerResponse.shopping_mall_selleruserid,
      ),
    );

    TestValidator.predicate(
      "response body is non-empty string",
      typeof sellerResponse.response_body === "string" &&
        sellerResponse.response_body.length > 0,
    );

    TestValidator.predicate(
      "is_private is boolean",
      typeof sellerResponse.is_private === "boolean",
    );

    TestValidator.predicate(
      "status is string and one of expected values",
      ["published", "draft", "deleted"].includes(sellerResponse.status),
    );

    // Validate timestamps strings are ISO date-time strings
    TestValidator.predicate(
      "created_at is ISO 8601 date-time string",
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(.\d+)?Z$/.test(
        sellerResponse.created_at,
      ),
    );
    TestValidator.predicate(
      "updated_at is ISO 8601 date-time string",
      /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(.\d+)?Z$/.test(
        sellerResponse.updated_at,
      ),
    );

    // deleted_at can be null, undefined, or ISO date-time string
    if (
      sellerResponse.deleted_at !== null &&
      sellerResponse.deleted_at !== undefined
    ) {
      TestValidator.predicate(
        "deleted_at is ISO 8601 date-time string",
        /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(.\d+)?Z$/.test(
          sellerResponse.deleted_at,
        ),
      );
    }
  }
}
