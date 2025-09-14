import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallReview } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallReview";
import { IPageIShoppingMallReview } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallReview";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Search and retrieve product reviews with filtering and pagination.
 *
 * This function fetches a paginated list of product review summaries belonging
 * to the authenticated member user, applying filters such as review title
 * keyword, rating range, and review status.
 *
 * @param props - Object containing the authenticated member user and search
 *   criteria
 * @param props.memberUser - Authenticated member user payload with user ID
 * @param props.body - Search and pagination criteria for reviews
 * @returns Paginated list of review summaries matching the criteria
 * @throws {Error} Will throw if any database error occurs
 */
export async function patch__shoppingMall_memberUser_reviews(props: {
  memberUser: MemberuserPayload;
  body: IShoppingMallReview.IRequest;
}): Promise<IPageIShoppingMallReview.ISummary> {
  const { memberUser, body } = props;

  // Use default pagination values if not provided or invalid
  const page = body.page && body.page > 0 ? body.page : 1;
  const limit = body.limit && body.limit > 0 ? body.limit : 10;

  // Build where condition with required filters
  const where = {
    deleted_at: null,
    shopping_mall_memberuserid: memberUser.id,
    ...(body.status !== undefined &&
      body.status !== null && { status: body.status }),
    ...(body.review_title !== undefined &&
      body.review_title !== null && {
        review_title: { contains: body.review_title },
      }),
    ...(body.min_rating !== undefined &&
    body.min_rating !== null &&
    body.max_rating !== undefined &&
    body.max_rating !== null
      ? { rating: { gte: body.min_rating, lte: body.max_rating } }
      : {
          ...(body.min_rating !== undefined &&
            body.min_rating !== null && { rating: { gte: body.min_rating } }),
          ...(body.max_rating !== undefined &&
            body.max_rating !== null && { rating: { lte: body.max_rating } }),
        }),
  };

  // Fetch data and total count concurrently from Prisma
  const [results, total] = await Promise.all([
    MyGlobal.prisma.shopping_mall_reviews.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        shopping_mall_channel_id: true,
        review_title: true,
        rating: true,
        is_private: true,
        status: true,
        created_at: true,
      },
    }),
    MyGlobal.prisma.shopping_mall_reviews.count({ where }),
  ]);

  return {
    pagination: {
      current: page,
      limit: limit,
      records: total,
      pages: Math.ceil(total / limit),
    },
    data: results.map((r) => ({
      id: r.id,
      shopping_mall_channel_id: r.shopping_mall_channel_id,
      review_title: r.review_title,
      rating: r.rating,
      is_private: r.is_private,
      status: r.status,
      created_at: toISOStringSafe(r.created_at),
    })),
  };
}
