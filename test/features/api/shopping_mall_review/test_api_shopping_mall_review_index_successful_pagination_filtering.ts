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
 * Test the successful retrieval of paginated and filtered product reviews
 * list for an authenticated member user.
 *
 * This test covers the following:
 *
 * 1. Registering a new member user (join) with valid data.
 * 2. Logging in as the registered member user.
 * 3. Performing a paginated, filtered review listing with various criteria:
 *    minimum and maximum rating, review title keyword, and review status.
 * 4. Verifying the responses include only reviews matching filter criteria and
 *    pagination metadata.
 * 5. Checking that unauthorized users cannot retrieve the reviews list.
 *
 * The test uses the proper DTO types and ensures all API responses are
 * validated with typia.assert. It uses TestValidator functions with
 * descriptive titles for validation and follows strict TypeScript typing
 * and schema compliance. Authentication headers are handled automatically
 * by the SDK during join and login operations.
 *
 * Business context ensures that the review listing API is appropriately
 * secured and filters reviews correctly according to query params.
 */
export async function test_api_shopping_mall_review_index_successful_pagination_filtering(
  connection: api.IConnection,
) {
  // 1. Member user creation (join) with random but valid data
  const createBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(12),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: null,
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;

  const user: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, { body: createBody });
  typia.assert(user);

  // 2. Member user login with same email and password
  const loginBody = {
    email: user.email,
    password: createBody.password_hash,
  } satisfies IShoppingMallMemberUser.ILogin;

  const loginResult: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.login(connection, { body: loginBody });
  typia.assert(loginResult);

  // 3. Perform review list retrieval with filters
  const requestBody = {
    page: 1,
    limit: 5,
    min_rating: 3,
    max_rating: 5,
    review_title: RandomGenerator.substring(
      "excellent product review positive",
    ),
    status: "published",
  } satisfies IShoppingMallReview.IRequest;

  const response: IPageIShoppingMallReview.ISummary =
    await api.functional.shoppingMall.memberUser.reviews.indexReview(
      connection,
      {
        body: requestBody,
      },
    );
  typia.assert(response);

  // 4. Validate that pagination metadata is coherent
  TestValidator.predicate(
    "pagination current page matches request",
    response.pagination.current === (requestBody.page ?? 1),
  );

  TestValidator.predicate(
    "pagination limit matches request",
    response.pagination.limit === (requestBody.limit ?? 10),
  );

  TestValidator.predicate(
    "pagination pages is positive integer",
    Number.isInteger(response.pagination.pages) &&
      response.pagination.pages >= 0,
  );

  TestValidator.predicate(
    "pagination records is non-negative integer",
    Number.isInteger(response.pagination.records) &&
      response.pagination.records >= 0,
  );

  // 5. Validate all reviews conform to the filter criteria
  for (const summary of response.data) {
    typia.assert(summary);

    TestValidator.predicate(
      `rating ${summary.rating} is between ${requestBody.min_rating} and ${requestBody.max_rating}`,
      summary.rating >= (requestBody.min_rating ?? -Infinity) &&
        summary.rating <= (requestBody.max_rating ?? Infinity),
    );
    TestValidator.predicate(
      `review title contains keyword substring '${requestBody.review_title}'`,
      requestBody.review_title === null ||
        requestBody.review_title === undefined ||
        summary.review_title.includes(requestBody.review_title),
    );
    TestValidator.equals(
      "review status matches filter",
      summary.status,
      requestBody.status ?? summary.status,
    );
  }

  // 6. Test access without authentication should fail
  const unauthenticatedConnection: api.IConnection = {
    ...connection,
    headers: {},
  };

  await TestValidator.error(
    "unauthorized access to review list should fail",
    async () => {
      await api.functional.shoppingMall.memberUser.reviews.indexReview(
        unauthenticatedConnection,
        { body: requestBody },
      );
    },
  );
}
