import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallSentimentAnalysis } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallSentimentAnalysis";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallSentimentAnalysis } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSentimentAnalysis";

export async function test_api_customer_sentiment_analysis_search_admin(
  connection: api.IConnection,
) {
  // Step 1: Authenticate as admin user through join endpoint
  const adminUserEmail = typia.random<string & tags.Format<"email">>();
  const adminUserCreateBody = {
    email: adminUserEmail,
    password_hash: RandomGenerator.alphaNumeric(12),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const adminUserAuthorized: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminUserCreateBody,
    });
  typia.assert(adminUserAuthorized);

  // Step 2: Perform filtered search on sentiment analysis with paging and filters
  // Define fixed realistic filter values for consistent testing
  // Generate random but valid UUID for product id filter
  const productId = typia.random<string & tags.Format<"uuid">>();
  // Sentiment category choices (assuming real categories are string literals, we use example 'positive', 'neutral', 'negative')
  const sentimentCategories = ["positive", "neutral", "negative"] as const;

  // Test valid filter with pagination
  const filterRequest1 = {
    product_id: productId,
    sentiment_category: RandomGenerator.pick(sentimentCategories),
    sentiment_score_min: 0.0,
    sentiment_score_max: 1.0,
    analysis_date_from: new Date(
      Date.now() - 1000 * 60 * 60 * 24 * 30,
    ).toISOString(), // 30 days ago
    analysis_date_to: new Date().toISOString(),
    page: 0,
    limit: 10,
    orderBy: "sentiment_score",
    orderDirection: "desc",
  } satisfies IShoppingMallSentimentAnalysis.IRequest;

  const pageResult1: IPageIShoppingMallSentimentAnalysis.ISummary =
    await api.functional.shoppingMall.adminUser.sentimentAnalysis.index(
      connection,
      {
        body: filterRequest1,
      },
    );
  typia.assert(pageResult1);

  // Assertions: Verify pagination
  TestValidator.equals(
    "page matches requested page",
    pageResult1.pagination.current,
    filterRequest1.page ?? 0,
  );
  TestValidator.equals(
    "limit matches requested limit",
    pageResult1.pagination.limit,
    filterRequest1.limit ?? 10,
  );

  // Assertions: Validate each data entry matches filter criteria
  for (const summary of pageResult1.data) {
    typia.assert(summary);
    TestValidator.equals(
      "product_id matches filter",
      summary.product_id,
      filterRequest1.product_id,
    );
    TestValidator.predicate(
      "sentiment_score within min and max",
      summary.sentiment_score >=
        (filterRequest1.sentiment_score_min ?? -Infinity) &&
        summary.sentiment_score <=
          (filterRequest1.sentiment_score_max ?? Infinity),
    );
    TestValidator.equals(
      "sentiment_category matches filter",
      summary.sentiment_category,
      filterRequest1.sentiment_category,
    );
    TestValidator.predicate(
      "analysis_date between date_from and date_to",
      summary.analysis_date >=
        (filterRequest1.analysis_date_from ?? "0000-01-01T00:00:00Z") &&
        summary.analysis_date <=
          (filterRequest1.analysis_date_to ?? "9999-12-31T23:59:59Z"),
    );
  }

  // Test case 2: Test with filters that should realistically return empty data
  const filterRequest2 = {
    product_id: typia.random<string & tags.Format<"uuid">>(),
    sentiment_category: "neutral",
    sentiment_score_min: 0.9,
    sentiment_score_max: 1.0,
    analysis_date_from: new Date(
      Date.now() + 1000 * 60 * 60 * 24,
    ).toISOString(), // 1 day in the future
    analysis_date_to: new Date(
      Date.now() + 1000 * 60 * 60 * 24 * 2,
    ).toISOString(), // 2 days in the future
    page: 0,
    limit: 5,
    orderBy: "analysis_date",
    orderDirection: "asc",
  } satisfies IShoppingMallSentimentAnalysis.IRequest;

  const pageResult2: IPageIShoppingMallSentimentAnalysis.ISummary =
    await api.functional.shoppingMall.adminUser.sentimentAnalysis.index(
      connection,
      {
        body: filterRequest2,
      },
    );
  typia.assert(pageResult2);

  TestValidator.equals(
    "empty data for future date filter",
    pageResult2.data.length,
    0,
  );

  // Step 3: Authorization failure tests
  // Attempt to call sentiment analysis endpoint without auth token
  // Create unauthenticated connection with empty headers
  const unauthConn: api.IConnection = { ...connection, headers: {} };

  await TestValidator.error("unauthorized access without token", async () => {
    await api.functional.shoppingMall.adminUser.sentimentAnalysis.index(
      unauthConn,
      {
        body: filterRequest1,
      },
    );
  });
}
