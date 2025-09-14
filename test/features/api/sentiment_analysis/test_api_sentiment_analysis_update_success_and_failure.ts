import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallSentimentAnalysis } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSentimentAnalysis";

/**
 * Test scenario for updating a customer sentiment analysis record by an
 * authenticated admin user.
 *
 * This test verifies:
 *
 * - Successful update with valid data.
 * - Failure on update attempt with non-existent sentimentAnalysisId.
 * - Failure on update attempt without authentication.
 *
 * Steps:
 *
 * 1. Register an admin user to acquire authentication.
 * 2. Create realistic update payload.
 * 3. Attempt a valid update; verify the response.
 * 4. Attempt update with invalid ID; expect failure.
 * 5. Attempt update without authentication; expect failure.
 *
 * All responses are validated for type fidelity using typia.assert.
 */
export async function test_api_sentiment_analysis_update_success_and_failure(
  connection: api.IConnection,
) {
  // Step 1: Create admin user and authenticate
  const adminUserEmail = typia.random<string & tags.Format<"email">>();
  const adminUserPasswordHash = RandomGenerator.alphaNumeric(32);
  const adminUserNickname = RandomGenerator.name();
  const adminUserFullName = RandomGenerator.name(2);
  const adminUserStatus = "active";

  const adminUserCreateBody = {
    email: adminUserEmail,
    password_hash: adminUserPasswordHash,
    nickname: adminUserNickname,
    full_name: adminUserFullName,
    status: adminUserStatus,
  } satisfies IShoppingMallAdminUser.ICreate;

  const adminUserAuthorized: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminUserCreateBody,
    });
  typia.assert(adminUserAuthorized);

  // Step 2: Prepare valid update data
  const updateBody = {
    product_id: typia.random<string & tags.Format<"uuid">>(),
    user_id: typia.random<string & tags.Format<"uuid">>(),
    sentiment_score: parseFloat((Math.random() * 2 - 1).toFixed(4)),
    sentiment_category: RandomGenerator.pick([
      "positive",
      "neutral",
      "negative",
    ] as const),
    source_text: RandomGenerator.content({
      paragraphs: 1,
      sentenceMin: 3,
      sentenceMax: 8,
      wordMin: 4,
      wordMax: 10,
    }),
    analysis_date: new Date().toISOString(),
    deleted_at: null,
  } satisfies IShoppingMallSentimentAnalysis.IUpdate;

  // Step 3: Successful update invocation with valid ID
  const validSentimentAnalysisId = typia.random<string & tags.Format<"uuid">>();
  const updatedRecord: IShoppingMallSentimentAnalysis =
    await api.functional.shoppingMall.adminUser.sentimentAnalysis.update(
      connection,
      {
        sentimentAnalysisId: validSentimentAnalysisId,
        body: updateBody,
      },
    );
  typia.assert(updatedRecord);

  TestValidator.equals(
    "Valid update: sentimentAnalysisId matches",
    updatedRecord.id,
    validSentimentAnalysisId,
  );

  // Step 4: Attempt update with invalid sentimentAnalysisId
  const invalidSentimentAnalysisId = typia.random<
    string & tags.Format<"uuid">
  >();
  await TestValidator.error(
    "Update with non-existent sentimentAnalysisId should fail",
    async () => {
      await api.functional.shoppingMall.adminUser.sentimentAnalysis.update(
        connection,
        {
          sentimentAnalysisId: invalidSentimentAnalysisId,
          body: updateBody,
        },
      );
    },
  );

  // Step 5: Attempt update without authentication
  const unauthenticatedConnection: api.IConnection = {
    ...connection,
    headers: {},
  };
  await TestValidator.error(
    "Update without authentication should fail",
    async () => {
      await api.functional.shoppingMall.adminUser.sentimentAnalysis.update(
        unauthenticatedConnection,
        {
          sentimentAnalysisId: validSentimentAnalysisId,
          body: updateBody,
        },
      );
    },
  );
}
