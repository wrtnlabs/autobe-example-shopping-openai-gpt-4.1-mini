import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallSellerResponse } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallSellerResponse";
import type { IShoppingMallSellerResponse } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerResponse";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * This E2E test validates the seller response search feature accessed by an
 * authenticated seller user.
 *
 * Business context: Seller users can manage responses to customer inquiries
 * or reviews through this API. The search endpoint supports pagination and
 * filtering by privacy and response status. The test covers the full flow
 * from user registration, authentication, search request with filters, and
 * validating the returned data and pagination.
 *
 * Test details:
 *
 * 1. Register a seller user using the join API with realistic user data.
 * 2. Ensure the seller user is authenticated (token handled internally).
 * 3. Invoke the sellerResponses search API with filters:
 *
 *    - Page = 1
 *    - Limit = 5
 *    - Is_private = false
 *    - Status = "published"
 * 4. Validate that every returned seller response's seller user ID matches the
 *    authenticated user.
 * 5. Validate filtering is correctly applied for is_private and status.
 * 6. Validate pagination structure: current page, limit, total records are
 *    consistent.
 * 7. Use typia.assert to check response typing and TestValidator for business
 *    rule validations.
 */
export async function test_api_sellerresponse_search_success(
  connection: api.IConnection,
) {
  // Step 1: Register a new seller user
  const createBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password: "StrongP@ssw0rd!",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: RandomGenerator.mobile(),
    business_registration_number: `BRN${RandomGenerator.alphaNumeric(9)}`,
  } satisfies IShoppingMallSellerUser.ICreate;

  const user: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: createBody,
    });
  typia.assert(user);

  // Step 2: Prepare the request body for seller responses search
  const requestBody = {
    page: 1,
    limit: 5,
    is_private: false,
    status: "published",
    search: null,
  } satisfies IShoppingMallSellerResponse.IRequest;

  // Step 3: Invoke the sellerResponses search API
  const result: IPageIShoppingMallSellerResponse =
    await api.functional.shoppingMall.sellerUser.sellerResponses.index(
      connection,
      {
        body: requestBody,
      },
    );
  typia.assert(result);

  // Step 4: Validate pagination info
  TestValidator.equals(
    "pagination current page matches requested page",
    result.pagination.current,
    requestBody.page,
  );
  TestValidator.equals(
    "pagination limit matches requested limit",
    result.pagination.limit,
    requestBody.limit,
  );
  TestValidator.predicate(
    "pagination records is non-negative",
    result.pagination.records >= 0,
  );
  TestValidator.predicate(
    "pagination pages is consistent",
    result.pagination.pages >= 0 &&
      result.pagination.pages >=
        Math.ceil(result.pagination.records / result.pagination.limit),
  );

  // Step 5: Validate each seller response
  for (const response of result.data) {
    typia.assert(response);
    TestValidator.equals(
      "response seller user ID matches authenticated user",
      response.shopping_mall_selleruserid,
      user.id,
    );
    TestValidator.equals(
      "response privacy flag matches filter",
      response.is_private,
      requestBody.is_private,
    );
    TestValidator.equals(
      "response status matches filter",
      response.status,
      requestBody.status,
    );
  }
}
