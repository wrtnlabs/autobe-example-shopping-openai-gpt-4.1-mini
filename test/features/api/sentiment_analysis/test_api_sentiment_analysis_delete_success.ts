import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallSentimentAnalysis } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSentimentAnalysis";

/**
 * Validate successful deletion of a sentiment analysis record.
 *
 * This test verifies the full workflow for deleting a sentiment analysis
 * record in the shopping mall admin system. It covers:
 *
 * 1. Registering an admin user with required profile information.
 * 2. Creating a new sentiment analysis record with all mandatory properties,
 *    using valid random values and explicit null for optional user_id.
 * 3. Deleting the sentiment analysis record by its unique UUID identifier.
 * 4. Attempting to delete the same record again, expecting failure and error
 *    validation.
 *
 * The test ensures all requests succeed as expected and proper error
 * handling occurs on double deletion attempts. It uses typia.assert for
 * response validation and TestValidator for assertion checks.
 *
 * All schema constraints, property existence rules, and format requirements
 * are strictly followed to guarantee completeness and correctness.
 *
 * The SDK's automatic header and token handling is leveraged, with no
 * manual header manipulation. All test data is realistic and contextually
 * appropriate.
 *
 * This test fully validates the delete sentiment analysis API endpoint
 * functionality within the admin user context.
 */
export async function test_api_sentiment_analysis_delete_success(
  connection: api.IConnection,
) {
  // 1. Register admin user with valid required fields
  const adminEmail: string = typia.random<string & tags.Format<"email">>();
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: adminEmail,
        password_hash:
          "$2b$12$KIXIvFhlE2vymeJk5u8Ic.qn9ft6mN4GUNZgjQTJMhLu4n89VC2Ry",
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // 2. Create a sentiment analysis record to be deleted
  const createInput = {
    product_id: typia.random<string & tags.Format<"uuid">>(),
    user_id: null,
    sentiment_score: Math.random() * 2 - 1, // Range -1 to 1
    sentiment_category: "positive",
    source_text: RandomGenerator.paragraph(),
    analysis_date: new Date().toISOString(),
  } satisfies IShoppingMallSentimentAnalysis.ICreate;

  const createdSentiment: IShoppingMallSentimentAnalysis =
    await api.functional.shoppingMall.adminUser.sentimentAnalysis.create(
      connection,
      { body: createInput },
    );
  typia.assert(createdSentiment);

  // 3. Delete the created sentiment analysis record by ID
  await api.functional.shoppingMall.adminUser.sentimentAnalysis.erase(
    connection,
    {
      sentimentAnalysisId: createdSentiment.id,
    },
  );

  // 4. Attempt to delete the same record again; expect error
  await TestValidator.error(
    "Deleting non-existent sentiment analysis record should fail",
    async () => {
      await api.functional.shoppingMall.adminUser.sentimentAnalysis.erase(
        connection,
        {
          sentimentAnalysisId: createdSentiment.id,
        },
      );
    },
  );
}
