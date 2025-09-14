import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallComment } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallComment";
import { IPageIShoppingMallComment } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallComment";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

export async function patch__shoppingMall_adminUser_inquiries_$inquiryId_comments(props: {
  adminUser: AdminuserPayload;
  inquiryId: string & tags.Format<"uuid">;
  body: IShoppingMallComment.IRequest;
}): Promise<IPageIShoppingMallComment.ISummary> {
  const { adminUser, inquiryId, body } = props;
  const page = body.page ?? 0;
  const limit = body.limit ?? 20;
  const skip = page * limit;
  const sortBy = body.sort_by ?? "created_at";
  const sortOrder = body.sort_order === "asc" ? "asc" : "desc";

  const where = {
    deleted_at: null,
    shopping_mall_inquiry_id: inquiryId,
    ...(body.filter && typeof body.filter === "object"
      ? {
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
          ...(body.filter.shopping_mall_inquiry_id !== undefined &&
          body.filter.shopping_mall_inquiry_id !== null
            ? { shopping_mall_inquiry_id: body.filter.shopping_mall_inquiry_id }
            : {}),
          ...(body.filter.shopping_mall_review_id !== undefined &&
          body.filter.shopping_mall_review_id !== null
            ? { shopping_mall_review_id: body.filter.shopping_mall_review_id }
            : {}),
          ...(body.filter.search !== undefined &&
          body.filter.search !== null &&
          body.filter.search !== ""
            ? { comment_body: { contains: body.filter.search } }
            : {}),
        }
      : {}),
  };

  const [comments, total] = await Promise.all([
    MyGlobal.prisma.shopping_mall_comments.findMany({
      where,
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    }),
    MyGlobal.prisma.shopping_mall_comments.count({ where }),
  ]);

  return {
    pagination: {
      current: Number(page),
      limit: Number(limit),
      records: total,
      pages: Math.ceil(total / limit),
    },
    data: comments.map((comment) => ({
      id: comment.id as string & tags.Format<"uuid">,
      shopping_mall_inquiry_id: comment.shopping_mall_inquiry_id
        ? (comment.shopping_mall_inquiry_id as string & tags.Format<"uuid">)
        : null,
      shopping_mall_review_id: comment.shopping_mall_review_id
        ? (comment.shopping_mall_review_id as string & tags.Format<"uuid">)
        : null,
      comment_body: comment.comment_body,
      is_private: comment.is_private,
      status: comment.status,
      created_at: toISOStringSafe(comment.created_at),
    })),
  };
}
