import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallAiRecommendation } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAiRecommendation";

export async function test_api_ai_recommendations_creation_success(
  connection: api.IConnection,
) {
  // Step 1: Create an admin user with realistic data matching IShoppingMallAdminUser.ICreate
  const adminUserCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(32),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminUserCreateBody,
    });
  typia.assert(adminUser);

  // Step 2: Use created admin user context to create an AI recommendation
  const userId = typia.random<string & tags.Format<"uuid">>();
  const recommendationCreateBody = {
    user_id: userId,
    recommendation_type: "personal",
    algorithm_version: "1.0.0",
    payload: JSON.stringify({
      products: ["prod_001", "prod_002"],
      generated_at: new Date().toISOString(),
    }),
    status: "active",
  } satisfies IShoppingMallAiRecommendation.ICreate;

  const aiRecommendation: IShoppingMallAiRecommendation =
    await api.functional.shoppingMall.adminUser.aiRecommendations.create(
      connection,
      {
        body: recommendationCreateBody,
      },
    );
  typia.assert(aiRecommendation);

  // Step 3: Validate returned AI recommendation contents
  TestValidator.predicate(
    "AI recommendation has id",
    typeof aiRecommendation.id === "string" && aiRecommendation.id.length > 0,
  );
  TestValidator.equals(
    "AI recommendation user_id matches",
    aiRecommendation.user_id,
    userId,
  );
  TestValidator.equals(
    "AI recommendation type matches",
    aiRecommendation.recommendation_type,
    "personal",
  );
  TestValidator.equals(
    "AI recommendation algorithm_version matches",
    aiRecommendation.algorithm_version,
    "1.0.0",
  );
  TestValidator.equals(
    "AI recommendation payload matches",
    aiRecommendation.payload,
    recommendationCreateBody.payload,
  );
  TestValidator.equals(
    "AI recommendation status matches",
    aiRecommendation.status,
    "active",
  );

  TestValidator.predicate(
    "AI recommendation created_at is ISO string",
    typeof aiRecommendation.created_at === "string" &&
      aiRecommendation.created_at.length > 0,
  );
  TestValidator.predicate(
    "AI recommendation updated_at is ISO string",
    typeof aiRecommendation.updated_at === "string" &&
      aiRecommendation.updated_at.length > 0,
  );
  TestValidator.predicate(
    "AI recommendation deleted_at is null or undefined",
    aiRecommendation.deleted_at === null ||
      aiRecommendation.deleted_at === undefined,
  );
}
