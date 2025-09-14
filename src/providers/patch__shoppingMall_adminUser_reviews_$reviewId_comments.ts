import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallComment } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallComment";
import { IPageIShoppingMallComment } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallComment";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Retrieve a paginated list of comments for a product review.
 *
 * This operation fetches comments associated with the specified reviewId,
 * supporting filtering, searching, pagination, and sorting. Only comments that
 * are not soft-deleted (deleted_at is null) are included.
 *
 * @param props - Object containing adminUser payload, reviewId path parameter,
 *   and request body for filters and pagination.
 * @returns Paginated list of shopping mall comments matching the criteria.
 * @throws {Error} Throws if database operations fail.
 */
export async function patch__shoppingMall_adminUser_reviews_$reviewId_comments(props: {
  adminUser: AdminuserPayload;
  reviewId: string & tags.Format<"uuid">;
  body: IShoppingMallComment.IRequest;
}): Promise<IPageIShoppingMallComment> {
  const { reviewId, body } = props;

  const page: number =
    body.page !== undefined && body.page !== null ? body.page : 1;
  const limit: number =
    body.limit !== undefined && body.limit !== null ? body.limit : 10;

  const where = {
    deleted_at: null as null,
    shopping_mall_review_id: reviewId as string & tags.Format<"uuid">,
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
          ...(body.filter.shopping_mall_memberuserid !== undefined &&
          body.filter.shopping_mall_memberuserid !== null
            ? {
                shopping_mall_memberuserid:
                  body.filter.shopping_mall_memberuserid,
              }
            : {}),
          ...(body.filter.search !== undefined && body.filter.search !== null
            ? { comment_body: { contains: body.filter.search } }
            : {}),
        }
      : {}),
  };

  const sortBy: string =
    body.sort_by !== undefined && body.sort_by !== null
      ? body.sort_by
      : "created_at";
  const sortOrder: "asc" | "desc" = body.sort_order === "asc" ? "asc" : "desc";

  const [records, total] = await Promise.all([
    MyGlobal.prisma.shopping_mall_comments.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip: (page - 1) * limit,
      take: limit,
    }),
    MyGlobal.prisma.shopping_mall_comments.count({ where }),
  ]);

  return {
    pagination: {
      current: page,
      limit: limit,
      records: total,
      pages: Math.ceil(total / limit),
    },
    data: records.map((comment) => ({
      id: comment.id as string & tags.Format<"uuid">,
      shopping_mall_review_id: comment.shopping_mall_review_id ?? null,
      shopping_mall_memberuserid: comment.shopping_mall_memberuserid ?? null,
      shopping_mall_guestuserid: comment.shopping_mall_guestuserid ?? null,
      shopping_mall_selleruserid: comment.shopping_mall_selleruserid ?? null,
      comment_body: comment.comment_body,
      is_private: comment.is_private,
      status: comment.status,
      created_at: toISOStringSafe(comment.created_at),
      updated_at: toISOStringSafe(comment.updated_at),
      deleted_at: comment.deleted_at
        ? toISOStringSafe(comment.deleted_at)
        : null,
    })),
  };
}
