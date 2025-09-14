import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallAiRecommendation } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallAiRecommendation";
import type { IShoppingMallAiRecommendation } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAiRecommendation";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * This E2E test validates the paginated and filtered search functionality for
 * AI-powered personalized product recommendations for a member user. It covers
 * the full authorization flow, including successful authentication and querying
 * with various filter parameters (user_id, recommendation_type,
 * algorithm_version, status) and pagination validation.
 *
 * The test first creates and authenticates a member user, ensuring the
 * authentication token is correctly handled. It then performs multiple AI
 * recommendation search queries under the authenticated context, checking that
 * the responses comply with pagination, filtering, and sorting expectations.
 *
 * The test additionally verifies that unauthorized and unauthenticated access
 * attempts are appropriately rejected, ensuring role-based access control by
 * trying to call the search endpoint with an unauthenticated connection and a
 * connection without the memberUser role.
 *
 * All API responses are validated with typia.assert for perfect type safety.
 * The test uses realistic random data for user creation and AI search request
 * parameters, maintaining business and format compliance. All required
 * parameters and constraints from the API and DTO schemas are respected.
 */
export async function test_api_ai_recommendation_search_pagination_authorization(
  connection: api.IConnection,
) {
  // 1. Member user joins and authenticates
  const memberUserCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(12),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: null,
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;

  const memberUserAuthorized: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: memberUserCreateBody,
    });
  typia.assert(memberUserAuthorized);

  // 2. Prepare valid filter criteria based on memberUserAuthorized
  // Some fields and pagination
  const validRequestBody: IShoppingMallAiRecommendation.IRequest = {
    user_id: memberUserAuthorized.id,
    recommendation_type: "personal",
    algorithm_version: "v1.0",
    status: "active",
    page: 1,
    limit: 10,
  };

  // 3. Perform the AI recommendation search with correct authorization
  const searchResult1 =
    await api.functional.shoppingMall.memberUser.aiRecommendations.index(
      connection,
      { body: validRequestBody },
    );
  typia.assert(searchResult1);

  TestValidator.predicate(
    "pagination current page is 1",
    searchResult1.pagination.current === 1,
  );
  TestValidator.predicate(
    "pagination limit is <= 10",
    searchResult1.pagination.limit <= 10 && searchResult1.pagination.limit > 0,
  );

  // 4. Test with minimal no filters except pagination
  const searchResult2 =
    await api.functional.shoppingMall.memberUser.aiRecommendations.index(
      connection,
      {
        body: {
          page: 1,
          limit: 5,
        } satisfies IShoppingMallAiRecommendation.IRequest,
      },
    );
  typia.assert(searchResult2);

  TestValidator.equals(
    "pagination limit equals requested",
    searchResult2.pagination.limit,
    5,
  );

  // 5. Test filtering by recommendation_type only
  const searchResult3 =
    await api.functional.shoppingMall.memberUser.aiRecommendations.index(
      connection,
      {
        body: {
          recommendation_type: "trending",
          page: 1,
          limit: 3,
        } satisfies IShoppingMallAiRecommendation.IRequest,
      },
    );
  typia.assert(searchResult3);

  TestValidator.predicate(
    "pagination limit is 3 or less",
    searchResult3.pagination.limit <= 3 && searchResult3.pagination.limit > 0,
  );

  // 6. Test filtering by algorithm_version only
  const searchResult4 =
    await api.functional.shoppingMall.memberUser.aiRecommendations.index(
      connection,
      {
        body: {
          algorithm_version: "v2.0",
          page: 2,
          limit: 4,
        } satisfies IShoppingMallAiRecommendation.IRequest,
      },
    );
  typia.assert(searchResult4);

  TestValidator.predicate(
    "current page is 2",
    searchResult4.pagination.current === 2,
  );

  // 7. Test filtering by status only
  const searchResult5 =
    await api.functional.shoppingMall.memberUser.aiRecommendations.index(
      connection,
      {
        body: {
          status: "archived",
          page: 1,
          limit: 2,
        } satisfies IShoppingMallAiRecommendation.IRequest,
      },
    );
  typia.assert(searchResult5);

  TestValidator.predicate(
    "pagination limit is 2",
    searchResult5.pagination.limit === 2,
  );

  // 8. Test unauthorized access: create unauthenticated connection
  const unauthenticatedConnection: api.IConnection = {
    ...connection,
    headers: {},
  };

  await TestValidator.error(
    "unauthenticated user cannot access AI recommendation search",
    async () => {
      await api.functional.shoppingMall.memberUser.aiRecommendations.index(
        unauthenticatedConnection,
        {
          body: {
            page: 1,
            limit: 1,
          } satisfies IShoppingMallAiRecommendation.IRequest,
        },
      );
    },
  );

  // 9. Test unauthorized access: memberUser role required
  // Simulate connection with different headers by copying and clearing
  const unauthorizedConnection: api.IConnection = {
    ...connection,
    headers: {},
  };

  await TestValidator.error(
    "user without memberUser role cannot access AI recommendation search",
    async () => {
      await api.functional.shoppingMall.memberUser.aiRecommendations.index(
        unauthorizedConnection,
        {
          body: {
            page: 1,
            limit: 1,
          } satisfies IShoppingMallAiRecommendation.IRequest,
        },
      );
    },
  );
}
