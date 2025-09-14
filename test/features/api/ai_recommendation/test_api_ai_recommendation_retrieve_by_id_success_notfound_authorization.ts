import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallAiRecommendation } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallAiRecommendation";
import type { IShoppingMallAiRecommendation } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAiRecommendation";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * Test retrieving detailed AI personalized product recommendation information
 * by recommendation ID for a member user. The scenario should cover successful
 * retrieval of existing recommendations, handling of not found errors for
 * invalid IDs, and authorization enforcement restricting access to the owning
 * member only.
 */
export async function test_api_ai_recommendation_retrieve_by_id_success_notfound_authorization(
  connection: api.IConnection,
) {
  // 1. Register the first member user
  const firstUserCreate = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: "SecurePass123!",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    phone_number: null,
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;

  const firstUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: firstUserCreate,
    });
  typia.assert(firstUser);

  // 2. Retrieve AI Recommendations for the first user
  const requests: IShoppingMallAiRecommendation.IRequest[] = [
    {
      user_id: firstUser.id,
    },
    {
      // Non-existent user_id to test not found
      user_id: typia.random<string & tags.Format<"uuid">>(),
    },
  ];

  for (const req of requests) {
    const response: IPageIShoppingMallAiRecommendation =
      await api.functional.shoppingMall.memberUser.aiRecommendations.index(
        connection,
        { body: req },
      );
    typia.assert(response);

    if (req.user_id === firstUser.id) {
      // Should return some recommendations
      TestValidator.predicate(
        "recommendations must include at least one for first user",
        response.data.length > 0,
      );

      response.data.forEach((item) => {
        typia.assert<IShoppingMallAiRecommendation>(item);
        TestValidator.equals(
          "status field must be present",
          typeof item.status,
          "string",
        );
        TestValidator.predicate(
          "payload field must be non-empty",
          item.payload.length > 0,
        );
      });
    } else {
      // Should return no recommendations for unknown user
      TestValidator.equals(
        "no recommendations for non-existent user",
        response.data.length,
        0,
      );
    }
  }

  // 3. Register a second member user for authorization test
  const secondUserCreate = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: "SecurePass456!",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    phone_number: null,
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;

  const secondUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: secondUserCreate,
    });
  typia.assert(secondUser);

  // 4. Using second user's authenticated connection, retrieve first user's recommendations
  // Authorization should prevent access to first user's recommendations
  const unauthorizedResponse: IPageIShoppingMallAiRecommendation =
    await api.functional.shoppingMall.memberUser.aiRecommendations.index(
      connection,
      {
        body: { user_id: firstUser.id },
      },
    );
  typia.assert(unauthorizedResponse);

  TestValidator.equals(
    "authorization blocks second user from seeing first user's recommendations",
    unauthorizedResponse.data.length,
    0,
  );
}
