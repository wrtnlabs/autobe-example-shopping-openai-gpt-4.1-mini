import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";
import type { IShoppingMallSentimentAnalysis } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSentimentAnalysis";

/**
 * Test unauthorized deletion of a sentiment analysis record by a non-admin
 * user.
 *
 * This E2E test validates that a non-admin member user cannot delete a
 * sentiment analysis record, ensuring the API enforces role-based access
 * control.
 *
 * Steps:
 *
 * 1. Create a non-admin member user via /auth/memberUser/join.
 * 2. Create an admin user via /auth/adminUser/join to fulfill authorization.
 * 3. Create a sentiment analysis record as the admin user.
 * 4. Attempt to delete the sentiment analysis record with a non-admin
 *    connection.
 * 5. Confirm the deletion is rejected with forbidden/unauthorized error.
 */
export async function test_api_sentiment_analysis_delete_unauthorized(
  connection: api.IConnection,
) {
  // 1. Create a non-admin member user
  const memberUserBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: "Password123!",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    phone_number: RandomGenerator.mobile(),
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;
  const memberUser = await api.functional.auth.memberUser.join(connection, {
    body: memberUserBody,
  });
  typia.assert(memberUser);

  // 2. Create an admin user
  const adminUserBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: "AdminPass123!",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;
  const adminUser = await api.functional.auth.adminUser.join(connection, {
    body: adminUserBody,
  });
  typia.assert(adminUser);

  // 3. Create a sentiment analysis record as the admin user
  const sentimentAnalysisBody = {
    product_id: typia.random<string & tags.Format<"uuid">>(),
    user_id: memberUser.id,
    sentiment_score: 0.5,
    sentiment_category: "neutral",
    source_text: RandomGenerator.paragraph({
      sentences: 4,
      wordMin: 4,
      wordMax: 8,
    }),
    analysis_date: new Date().toISOString(),
  } satisfies IShoppingMallSentimentAnalysis.ICreate;
  const sentimentAnalysis =
    await api.functional.shoppingMall.adminUser.sentimentAnalysis.create(
      connection,
      {
        body: sentimentAnalysisBody,
      },
    );
  typia.assert(sentimentAnalysis);

  // 4. Create unauthenticated connection representing a non-admin user
  const unauthConn: api.IConnection = { ...connection, headers: {} };

  // 5. Attempt to delete the sentiment analysis record as non-admin
  await TestValidator.error(
    "non-admin user cannot delete sentiment analysis record",
    async () => {
      await api.functional.shoppingMall.adminUser.sentimentAnalysis.erase(
        unauthConn,
        {
          sentimentAnalysisId: sentimentAnalysis.id,
        },
      );
    },
  );
}
