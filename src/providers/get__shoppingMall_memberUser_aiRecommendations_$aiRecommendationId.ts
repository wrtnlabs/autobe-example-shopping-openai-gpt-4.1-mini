import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallAiRecommendation } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAiRecommendation";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Retrieve AI-powered personalized recommendation details by unique ID.
 *
 * Access is restricted to the owner authenticated member user.
 *
 * Returns the complete recommendation information including payload and
 * timestamps.
 *
 * @param props - Object containing the memberUser authentication info and the
 *   aiRecommendationId parameter
 * @param props.memberUser - The authenticated member user making the request
 * @param props.aiRecommendationId - The unique identifier of the AI
 *   recommendation record to retrieve
 * @returns The AI recommendation record matching the ID
 * @throws {Error} When the recommendation is not found (Prisma
 *   findUniqueOrThrow throws)
 * @throws {Error} When the recommendation belongs to another user
 */
export async function get__shoppingMall_memberUser_aiRecommendations_$aiRecommendationId(props: {
  memberUser: MemberuserPayload;
  aiRecommendationId: string & tags.Format<"uuid">;
}): Promise<IShoppingMallAiRecommendation> {
  const { memberUser, aiRecommendationId } = props;

  const recommendation =
    await MyGlobal.prisma.shopping_mall_ai_recommendations.findUniqueOrThrow({
      where: { id: aiRecommendationId },
    });

  if (recommendation.user_id !== memberUser.id) {
    throw new Error(
      "Unauthorized access: Cannot access other's recommendation",
    );
  }

  return {
    id: recommendation.id,
    user_id: recommendation.user_id,
    recommendation_type: recommendation.recommendation_type,
    algorithm_version: recommendation.algorithm_version,
    payload: recommendation.payload,
    status: recommendation.status,
    created_at: toISOStringSafe(recommendation.created_at),
    updated_at: toISOStringSafe(recommendation.updated_at),
    deleted_at: recommendation.deleted_at
      ? toISOStringSafe(recommendation.deleted_at)
      : null,
  };
}
