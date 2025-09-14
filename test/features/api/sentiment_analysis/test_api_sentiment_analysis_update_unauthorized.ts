import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallSentimentAnalysis } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSentimentAnalysis";

/**
 * This test validates that attempts to update a customer sentiment analysis
 * record fail when the requester is either unauthenticated or lacks
 * adminUser authorization.
 *
 * Steps:
 *
 * 1. Create an admin user via the join endpoint as a prerequisite.
 * 2. Generate a valid sentiment analysis ID and update payload.
 * 3. Attempt the update with unauthenticated and unauthorized connections,
 *    expecting access denied errors.
 */
export async function test_api_sentiment_analysis_update_unauthorized(
  connection: api.IConnection,
) {
  // Step 1: Perform the prerequisite admin user join operation
  const adminUserInput = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(12),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;
  await api.functional.auth.adminUser.join(connection, {
    body: adminUserInput,
  });

  // Step 2: Generate valid sentiment analysis ID and update payload
  const sentimentAnalysisId = typia.random<string & tags.Format<"uuid">>();
  const updatePayload = {
    product_id: typia.random<string & tags.Format<"uuid">>(),
    user_id: null,
    sentiment_score: 0.85,
    sentiment_category: "positive",
    source_text: RandomGenerator.paragraph({
      sentences: 4,
      wordMin: 4,
      wordMax: 8,
    }),
    analysis_date: new Date().toISOString(),
    deleted_at: null,
  } satisfies IShoppingMallSentimentAnalysis.IUpdate;

  // Step 3: Create unauthenticated connection
  const unauthenticatedConnection: api.IConnection = {
    ...connection,
    headers: {},
  };

  // Step 4: Verify that update fails when unauthenticated
  await TestValidator.error("update fails when unauthenticated", async () => {
    await api.functional.shoppingMall.adminUser.sentimentAnalysis.update(
      unauthenticatedConnection,
      {
        sentimentAnalysisId,
        body: updatePayload,
      },
    );
  });

  // Step 5: Verify update fails when using unauthorized connection
  // Here, reusing unauthenticatedConnection as example of unauthorized
  await TestValidator.error("update fails when unauthorized", async () => {
    await api.functional.shoppingMall.adminUser.sentimentAnalysis.update(
      unauthenticatedConnection,
      {
        sentimentAnalysisId,
        body: updatePayload,
      },
    );
  });
}
