import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallAiRecommendation } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAiRecommendation";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Update an existing AI-powered recommendation record by its ID.
 *
 * AdminUser-only access to enforce AI data consistency.
 *
 * @param props - Props including authenticated admin user, AI recommendation
 *   ID, and update body
 * @param props.adminUser - The authenticated admin user performing the update
 * @param props.aiRecommendationId - The UUID of the AI recommendation to update
 * @param props.body - Partial update fields for the AI recommendation
 * @returns Updated AI recommendation record details
 * @throws {Error} When the AI recommendation record with the given ID does not
 *   exist
 */
export async function put__shoppingMall_adminUser_aiRecommendations_$aiRecommendationId(props: {
  adminUser: AdminuserPayload;
  aiRecommendationId: string & tags.Format<"uuid">;
  body: IShoppingMallAiRecommendation.IUpdate;
}): Promise<IShoppingMallAiRecommendation> {
  const { adminUser, aiRecommendationId, body } = props;

  // Authorization is implicit by presence of adminUser

  // Ensure the existing record exists or throw
  await MyGlobal.prisma.shopping_mall_ai_recommendations.findUniqueOrThrow({
    where: { id: aiRecommendationId },
  });

  const updated = await MyGlobal.prisma.shopping_mall_ai_recommendations.update(
    {
      where: { id: aiRecommendationId },
      data: {
        recommendation_type: body.recommendation_type ?? undefined,
        algorithm_version: body.algorithm_version ?? undefined,
        payload: body.payload ?? undefined,
        status: body.status ?? undefined,
        deleted_at: body.deleted_at ?? undefined,
      },
    },
  );

  return {
    id: updated.id,
    user_id: updated.user_id,
    recommendation_type: updated.recommendation_type,
    algorithm_version: updated.algorithm_version,
    payload: updated.payload,
    status: updated.status,
    created_at: toISOStringSafe(updated.created_at),
    updated_at: toISOStringSafe(updated.updated_at),
    deleted_at: updated.deleted_at ? toISOStringSafe(updated.deleted_at) : null,
  };
}
