import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallAiRecommendation } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAiRecommendation";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Creates a new AI-powered personalized product recommendation record in the
 * shopping mall system.
 *
 * This function allows an authorized admin user to submit AI recommendation
 * data, including user ID, recommendation type, algorithm version, payload, and
 * status. The record is created with timestamps and a generated UUID.
 *
 * @param props - Object containing admin user credentials and recommendation
 *   creation data
 * @param props.adminUser - Authenticated admin user making the request
 * @param props.body - AI recommendation creation data conforming to
 *   IShoppingMallAiRecommendation.ICreate
 * @returns The newly created AI recommendation record with all fields and
 *   timestamps
 * @throws {Error} If the creation fails due to database or validation errors
 */
export async function post__shoppingMall_adminUser_aiRecommendations(props: {
  adminUser: AdminuserPayload;
  body: IShoppingMallAiRecommendation.ICreate;
}): Promise<IShoppingMallAiRecommendation> {
  const id = v4();
  const now = toISOStringSafe(new Date());

  const created = await MyGlobal.prisma.shopping_mall_ai_recommendations.create(
    {
      data: {
        id: id,
        user_id: props.body.user_id,
        recommendation_type: props.body.recommendation_type,
        algorithm_version: props.body.algorithm_version,
        payload: props.body.payload,
        status: props.body.status,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
    },
  );

  return {
    id: created.id,
    user_id: created.user_id,
    recommendation_type: created.recommendation_type,
    algorithm_version: created.algorithm_version,
    payload: created.payload,
    status: created.status,
    created_at: toISOStringSafe(created.created_at),
    updated_at: toISOStringSafe(created.updated_at),
    deleted_at: created.deleted_at ? toISOStringSafe(created.deleted_at) : null,
  };
}
