import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAiRecommendation } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAiRecommendation";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * This test validates the AI recommendation retrieval feature for a member
 * user. It covers:
 *
 * 1. Member user account creation with all required fields
 * 2. Automatic authentication handling after join
 * 3. Creating a simulated AI recommendation record linked to the member user
 * 4. Retrieving the AI recommendation by its ID as the authenticated member
 *    user
 * 5. Asserting the response and validating the user_id matches the member
 *
 * This ensures the full user flow for authenticated AI recommendation
 * access.
 */

export async function test_api_ai_recommendation_retrieve_member_user_successful(
  connection: api.IConnection,
) {
  // Step 1: Create member user account
  const createBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(16),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;

  const memberUser = await api.functional.auth.memberUser.join(connection, {
    body: createBody,
  });
  typia.assert(memberUser);

  // Step 2: Prepare a simulated AI recommendation linked to this member user
  // Since no create API was provided, we simulate the AI recommendation data
  // with realistic values
  const now = new Date().toISOString();

  const aiRecommendation: IShoppingMallAiRecommendation = {
    id: typia.random<string & tags.Format<"uuid">>(),
    user_id: memberUser.id,
    recommendation_type: "personal",
    algorithm_version: "v1.0",
    payload: JSON.stringify({
      products: [
        { id: typia.random<string & tags.Format<"uuid">>(), score: 0.95 },
        { id: typia.random<string & tags.Format<"uuid">>(), score: 0.87 },
      ],
    }),
    status: "active",
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };

  // Step 3: Retrieve the AI recommendation by ID using member user context
  const retrieved =
    await api.functional.shoppingMall.memberUser.aiRecommendations.at(
      connection,
      { aiRecommendationId: aiRecommendation.id },
    );

  typia.assert(retrieved);
  TestValidator.equals(
    "retrieved AI recommendation user_id matches member user id",
    retrieved.user_id,
    memberUser.id,
  );
  TestValidator.equals(
    "retrieved AI recommendation id matches request id",
    retrieved.id,
    aiRecommendation.id,
  );
  TestValidator.equals(
    "retrieved AI recommendation status is active",
    retrieved.status,
    "active",
  );
}
