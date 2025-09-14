import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallComment } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallComment";
import { IPageIShoppingMallComment } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallComment";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

/**
 * Retrieve paginated comments list for a product review
 *
 * This operation fetches a filtered and paginated list of comments associated
 * with the specified product review id. It supports filters for comment
 * content, status, privacy, and author user id, alongside paging and sorting
 * criteria.
 *
 * @param props - Object containing authenticated sellerUser, reviewId
 *   identifier, and request filtering and pagination body
 * @returns Paginated list of matching comments in IPageIShoppingMallComment
 *   structure
 * @throws {Error} Throws error if database query fails
 */
export async function patch__shoppingMall_sellerUser_reviews_$reviewId_comments(props: {
  sellerUser: SelleruserPayload;
  reviewId: string & tags.Format<"uuid">;
  body: IShoppingMallComment.IRequest;
}): Promise<IPageIShoppingMallComment> {
  const { sellerUser, reviewId, body } = props;
  const page = body.page ?? 1;
  const limit = body.limit ?? 20;

  const where = {
    shopping_mall_review_id: reviewId,
    deleted_at: null as null | undefined,
    ...(body.filter !== undefined && body.filter !== null
      ? {
          ...(body.filter.search !== undefined && body.filter.search !== null
            ? { comment_body: { contains: body.filter.search } }
            : {}),
          ...(body.filter.status !== undefined && body.filter.status !== null
            ? { status: body.filter.status }
            : {}),
          ...(body.filter.is_private !== undefined &&
          body.filter.is_private !== null
            ? { is_private: body.filter.is_private }
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

  const orderBy = {
    [body.sort_by === "comment_body" ||
    body.sort_by === "is_private" ||
    body.sort_by === "status" ||
    body.sort_by === "created_at" ||
    body.sort_by === "updated_at"
      ? body.sort_by
      : "created_at"]: body.sort_order === "asc" ? "asc" : "desc",
  };

  const [data, total] = await Promise.all([
    MyGlobal.prisma.shopping_mall_comments.findMany({
      where: where,
      orderBy: orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    MyGlobal.prisma.shopping_mall_comments.count({ where: where }),
  ]);

  return {
    pagination: {
      current: Number(page),
      limit: Number(limit),
      records: total,
      pages: Math.ceil(total / limit),
    },
    data: data.map((comment) => ({
      comment_body: comment.comment_body,
      is_private: comment.is_private,
      status: comment.status,
      created_at: toISOStringSafe(comment.created_at),
      updated_at: toISOStringSafe(comment.updated_at),
    })),
  };
}
