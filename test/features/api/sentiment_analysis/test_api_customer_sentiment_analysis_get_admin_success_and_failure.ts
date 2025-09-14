import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallSentimentAnalysis } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSentimentAnalysis";

/**
 * Retrieve a specific customer sentiment analysis by its ID using an admin
 * user authentication context. The test verifies successful data retrieval
 * including correct sentiment score, category, and source text. Negative
 * tests include retrieving a non-existent sentimentAnalysisId expecting not
 * found error, and unauthorized access attempts.
 */
export async function test_api_customer_sentiment_analysis_get_admin_success_and_failure(
  connection: api.IConnection,
) {
  // 1. Admin user joins to obtain authorization
  const adminUserEmail: string & tags.Format<"email"> = typia.random<
    string & tags.Format<"email">
  >();
  const adminUserPasswordHash: string = RandomGenerator.alphaNumeric(20);
  const adminUserNickname: string = RandomGenerator.name();
  const adminUserFullName: string = RandomGenerator.name();
  const adminUserStatus = "active";

  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: adminUserEmail,
        password_hash: adminUserPasswordHash,
        nickname: adminUserNickname,
        full_name: adminUserFullName,
        status: adminUserStatus,
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // 2. Generate a random sentiment analysis ID
  const validSentimentAnalysisId: string & tags.Format<"uuid"> = typia.random<
    string & tags.Format<"uuid">
  >();

  // 3. Retrieve sentiment analysis by ID
  const sentimentAnalysis: IShoppingMallSentimentAnalysis =
    await api.functional.shoppingMall.adminUser.sentimentAnalysis.at(
      connection,
      { sentimentAnalysisId: validSentimentAnalysisId },
    );
  typia.assert(sentimentAnalysis);

  // 4. Validate that the retrieved ID matches the requested ID
  TestValidator.equals(
    "retrieved sentimentAnalysis id matches requested id",
    sentimentAnalysis.id,
    validSentimentAnalysisId,
  );

  // 5. Additional validations for fields
  TestValidator.predicate(
    "sentiment score is a finite number",
    typeof sentimentAnalysis.sentiment_score === "number" &&
      Number.isFinite(sentimentAnalysis.sentiment_score),
  );

  TestValidator.predicate(
    "sentiment category is a non-empty string",
    typeof sentimentAnalysis.sentiment_category === "string" &&
      sentimentAnalysis.sentiment_category.length > 0,
  );

  TestValidator.predicate(
    "source text is a non-empty string",
    typeof sentimentAnalysis.source_text === "string" &&
      sentimentAnalysis.source_text.length > 0,
  );

  TestValidator.predicate(
    "analysis date is a non-empty string",
    typeof sentimentAnalysis.analysis_date === "string" &&
      sentimentAnalysis.analysis_date.length > 0,
  );

  // 6. Negative test: attempt to retrieve a non-existent sentiment analysis record
  const invalidSentimentAnalysisId: string & tags.Format<"uuid"> = typia.random<
    string & tags.Format<"uuid">
  >();

  await TestValidator.error(
    "retrieving non-existent sentimentAnalysisId should fail",
    async () => {
      await api.functional.shoppingMall.adminUser.sentimentAnalysis.at(
        connection,
        { sentimentAnalysisId: invalidSentimentAnalysisId },
      );
    },
  );

  // 7. Unauthorized access test
  const unauthenticatedConnection: api.IConnection = {
    ...connection,
    headers: {},
  };

  await TestValidator.error(
    "unauthorized access to sentimentAnalysis should fail",
    async () => {
      await api.functional.shoppingMall.adminUser.sentimentAnalysis.at(
        unauthenticatedConnection,
        { sentimentAnalysisId: validSentimentAnalysisId },
      );
    },
  );
}
