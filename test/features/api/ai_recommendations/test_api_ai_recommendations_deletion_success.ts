import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallAiRecommendation } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAiRecommendation";

/**
 * End-to-End test for admin user AI recommendation deletion flow.
 *
 * Tests that an admin user can join (register) successfully, create an AI
 * recommendation, then delete the recommendation by ID without errors.
 *
 * The test performs realistic random data generation and uses typia asserts
 * for response validation.
 *
 * The admin authentication token management is done automatically by the
 * API client.
 *
 * This ensures API correctness and consistency for delete operations of AI
 * recommendations.
 */
export async function test_api_ai_recommendations_deletion_success(
  connection: api.IConnection,
) {
  // 1. Admin user creation
  const adminUserEmail: string = typia.random<string & tags.Format<"email">>();
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: adminUserEmail,
        password_hash: RandomGenerator.alphaNumeric(12),
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(2),
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // 2. Create an AI recommendation
  const aiRecommendationCreateBody = {
    user_id: typia.random<string & tags.Format<"uuid">>(),
    recommendation_type: RandomGenerator.pick([
      "personal",
      "trending",
      "category_top",
    ] as const),
    algorithm_version: `v${RandomGenerator.alphaNumeric(3)}`,
    payload: JSON.stringify({
      product_ids: ArrayUtil.repeat(3, () =>
        typia.random<string & tags.Format<"uuid">>(),
      ),
    }),
    status: "active",
  } satisfies IShoppingMallAiRecommendation.ICreate;

  const aiRecommendation: IShoppingMallAiRecommendation =
    await api.functional.shoppingMall.adminUser.aiRecommendations.create(
      connection,
      { body: aiRecommendationCreateBody },
    );
  typia.assert(aiRecommendation);

  // 3. Delete the AI recommendation by ID
  await api.functional.shoppingMall.adminUser.aiRecommendations.erase(
    connection,
    {
      aiRecommendationId: aiRecommendation.id,
    },
  );

  // 4. No response on delete. Success is no exception thrown.
}
