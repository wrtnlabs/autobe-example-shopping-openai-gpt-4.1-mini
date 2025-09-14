import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallAiRecommendation } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAiRecommendation";
import { IPageIShoppingMallAiRecommendation } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallAiRecommendation";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Searches AI-powered personalized product recommendations for the
 * authenticated member user.
 *
 * This operation returns paginated AI recommendations filtered by optional
 * criteria such as recommendation type, algorithm version, and status, sorted
 * by creation time descending.
 *
 * Only recommendations belonging to the authenticated member user are returned.
 *
 * @param props - Request props including authenticated memberUser and filter
 *   parameters.
 * @param props.memberUser - The authenticated member user payload containing
 *   the user ID.
 * @param props.body - Filter and pagination parameters for AI recommendations.
 * @returns A paginated list of AI recommendations matching the filters and
 *   pagination.
 * @throws {Error} Throws if database operations fail.
 */
export async function patch__shoppingMall_memberUser_aiRecommendations(props: {
  memberUser: MemberuserPayload;
  body: IShoppingMallAiRecommendation.IRequest;
}): Promise<IPageIShoppingMallAiRecommendation> {
  const { memberUser, body } = props;

  const page = body.page ?? 1;
  const limit = body.limit ?? 10;

  const where = {
    user_id: memberUser.id,
    ...(body.recommendation_type !== undefined &&
      body.recommendation_type !== null && {
        recommendation_type: body.recommendation_type,
      }),
    ...(body.algorithm_version !== undefined &&
      body.algorithm_version !== null && {
        algorithm_version: body.algorithm_version,
      }),
    ...(body.status !== undefined &&
      body.status !== null && {
        status: body.status,
      }),
    ...(((body.created_at_from !== undefined &&
      body.created_at_from !== null) ||
      (body.created_at_to !== undefined && body.created_at_to !== null)) && {
      created_at: {
        ...(body.created_at_from !== undefined &&
          body.created_at_from !== null && {
            gte: body.created_at_from,
          }),
        ...(body.created_at_to !== undefined &&
          body.created_at_to !== null && {
            lte: body.created_at_to,
          }),
      },
    }),
    deleted_at: null,
  };

  const skip = (page - 1) * limit;

  const [results, total] = await Promise.all([
    MyGlobal.prisma.shopping_mall_ai_recommendations.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip,
      take: limit,
    }),
    MyGlobal.prisma.shopping_mall_ai_recommendations.count({ where }),
  ]);

  return {
    pagination: {
      current: Number(page),
      limit: Number(limit),
      records: total,
      pages: Math.ceil(total / limit),
    },
    data: results.map((item) => ({
      id: item.id,
      user_id: item.user_id,
      recommendation_type: item.recommendation_type,
      algorithm_version: item.algorithm_version,
      payload: item.payload,
      status: item.status,
      created_at: toISOStringSafe(item.created_at),
      updated_at: toISOStringSafe(item.updated_at),
      deleted_at: item.deleted_at ? toISOStringSafe(item.deleted_at) : null,
    })),
  };
}
