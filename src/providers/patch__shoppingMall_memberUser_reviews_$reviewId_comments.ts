import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallComment } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallComment";
import { IPageIShoppingMallComment } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallComment";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Retrieve a filtered and paginated list of comments for a given product
 * review.
 *
 * This operation returns detailed information including comment content,
 * privacy settings, and status for review comments. It supports filtering,
 * sorting, and pagination.
 *
 * @param props - Object containing memberUser, reviewId, and filter body
 * @param props.memberUser - The authenticated member user making the request
 * @param props.reviewId - UUID of the product review to filter comments
 * @param props.body - Filtering, searching, and pagination criteria
 * @returns A paginated list of comments matching the criteria
 * @throws {Error} Throws when there's any error during the database operation
 */
export async function patch__shoppingMall_memberUser_reviews_$reviewId_comments(props: {
  memberUser: MemberuserPayload;
  reviewId: string & tags.Format<"uuid">;
  body: IShoppingMallComment.IRequest;
}): Promise<IPageIShoppingMallComment> {
  const { memberUser, reviewId, body } = props;

  const page = body.page ?? 1;
  const limit = body.limit ?? 20;

  const where = {
    shopping_mall_review_id: reviewId,
    deleted_at: null as null,
    ...(body.filter !== undefined && body.filter !== null
      ? {
          ...(body.filter.status !== undefined && body.filter.status !== null
            ? { status: body.filter.status }
            : {}),
          ...(body.filter.is_private !== undefined &&
          body.filter.is_private !== null
            ? { is_private: body.filter.is_private }
            : {}),
          ...(body.filter.shopping_mall_inquiry_id !== undefined &&
          body.filter.shopping_mall_inquiry_id !== null
            ? { shopping_mall_inquiry_id: body.filter.shopping_mall_inquiry_id }
            : {}),
          ...(body.filter.shopping_mall_review_id !== undefined &&
          body.filter.shopping_mall_review_id !== null
            ? { shopping_mall_review_id: body.filter.shopping_mall_review_id }
            : {}),
          ...(body.filter.shopping_mall_memberuserid !== undefined &&
          body.filter.shopping_mall_memberuserid !== null
            ? {
                shopping_mall_memberuserid:
                  body.filter.shopping_mall_memberuserid,
              }
            : {}),
        }
      : {}),
  };

  const results = await MyGlobal.prisma.shopping_mall_comments.findMany({
    where: where,
    skip: (page - 1) * limit,
    take: limit,
    orderBy:
      body.sort_by !== undefined &&
      body.sort_order !== undefined &&
      body.sort_by !== null &&
      body.sort_order !== null
        ? { [body.sort_by]: body.sort_order }
        : { created_at: "desc" },
  });

  const total = await MyGlobal.prisma.shopping_mall_comments.count({ where });

  return {
    pagination: {
      current: Number(page),
      limit: Number(limit),
      records: total,
      pages: Math.ceil(total / limit),
    },
    data: results.map((r) => ({
      comment_body: r.comment_body,
      is_private: r.is_private,
      status: r.status,
    })),
  };
}
