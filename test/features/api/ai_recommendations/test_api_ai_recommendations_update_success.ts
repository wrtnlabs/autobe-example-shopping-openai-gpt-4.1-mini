import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallAiRecommendation } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAiRecommendation";

export async function test_api_ai_recommendations_update_success(
  connection: api.IConnection,
) {
  // 1. Admin user joins - create admin and authenticate
  const adminUserEmail = typia.random<string & tags.Format<"email">>();
  const adminUserPasswordHash = RandomGenerator.alphaNumeric(64);
  const adminUserFullName = RandomGenerator.name(2);
  const adminUserNickname = RandomGenerator.name(1);
  const adminUserStatus = "active";

  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: adminUserEmail,
        password_hash: adminUserPasswordHash,
        full_name: adminUserFullName,
        nickname: adminUserNickname,
        status: adminUserStatus,
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // 2. Create initial AI recommendation
  const initialRecommendationCreateBody = {
    user_id: typia.random<string & tags.Format<"uuid">>(),
    recommendation_type: "personal",
    algorithm_version: "v1.0",
    payload: JSON.stringify({ recommendedProductIds: ["p1", "p2", "p3"] }),
    status: "active",
  } satisfies IShoppingMallAiRecommendation.ICreate;

  const initialRecommendation: IShoppingMallAiRecommendation =
    await api.functional.shoppingMall.adminUser.aiRecommendations.create(
      connection,
      { body: initialRecommendationCreateBody },
    );
  typia.assert(initialRecommendation);

  // 3. Update AI recommendation
  const updateBody = {
    recommendation_type: "trending",
    algorithm_version: "v2.5",
    payload: JSON.stringify({ recommendedProductIds: ["p4", "p5"] }),
    status: "archived",
  } satisfies IShoppingMallAiRecommendation.IUpdate;

  const updatedRecommendation: IShoppingMallAiRecommendation =
    await api.functional.shoppingMall.adminUser.aiRecommendations.update(
      connection,
      {
        aiRecommendationId: initialRecommendation.id,
        body: updateBody,
      },
    );
  typia.assert(updatedRecommendation);

  // 4. Validate updated fields
  TestValidator.equals(
    "updated recommendation id matches original",
    updatedRecommendation.id,
    initialRecommendation.id,
  );
  TestValidator.equals(
    "updated recommendation user_id unchanged",
    updatedRecommendation.user_id,
    initialRecommendation.user_id,
  );
  TestValidator.equals(
    "updated recommendation recommendation_type",
    updatedRecommendation.recommendation_type,
    updateBody.recommendation_type!,
  );
  TestValidator.equals(
    "updated recommendation algorithm_version",
    updatedRecommendation.algorithm_version,
    updateBody.algorithm_version!,
  );
  TestValidator.equals(
    "updated recommendation payload",
    updatedRecommendation.payload,
    updateBody.payload!,
  );
  TestValidator.equals(
    "updated recommendation status",
    updatedRecommendation.status,
    updateBody.status!,
  );

  // Validate created_at unchanged
  TestValidator.equals(
    "created_at remains unchanged",
    updatedRecommendation.created_at,
    initialRecommendation.created_at,
  );

  // Validate updated_at is newer or equal to created_at (ISO string compare)
  TestValidator.predicate(
    "updated_at is newer or equal to created_at",
    updatedRecommendation.updated_at >= updatedRecommendation.created_at,
  );

  // Validate deleted_at still null or undefined
  TestValidator.predicate(
    "deleted_at remains null or undefined",
    updatedRecommendation.deleted_at === null ||
      updatedRecommendation.deleted_at === undefined,
  );
}
