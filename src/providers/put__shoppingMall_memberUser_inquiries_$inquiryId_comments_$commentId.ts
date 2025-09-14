import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallComment } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallComment";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Update a comment under a specific inquiry by commentId.
 *
 * Allows editing of comment content, privacy, and status. Ensures linkage
 * integrity and user authorization. Timestamps updated accordingly for
 * auditing.
 *
 * @param props - Object containing memberUser, inquiryId, commentId, and
 *   request body
 * @returns Updated comment fields matching IShoppingMallComment
 * @throws {Error} When comment not found or unauthorized access
 */
export async function put__shoppingMall_memberUser_inquiries_$inquiryId_comments_$commentId(props: {
  memberUser: { id: string & tags.Format<"uuid">; type: "memberuser" };
  inquiryId: string & tags.Format<"uuid">;
  commentId: string & tags.Format<"uuid">;
  body: IShoppingMallComment.IUpdate;
}): Promise<IShoppingMallComment> {
  const { memberUser, inquiryId, commentId, body } = props;

  const comment = await MyGlobal.prisma.shopping_mall_comments.findFirst({
    where: {
      id: commentId,
      shopping_mall_inquiry_id: inquiryId,
      deleted_at: null,
    },
  });

  if (!comment) {
    throw new Error(
      "Comment not found for the specified inquiry and comment ID",
    );
  }

  if (comment.shopping_mall_memberuserid !== memberUser.id) {
    throw new Error("Unauthorized: You can only update your own comments");
  }

  const now = toISOStringSafe(new Date());

  const updated = await MyGlobal.prisma.shopping_mall_comments.update({
    where: { id: commentId },
    data: {
      ...(body.comment_body !== undefined && {
        comment_body: body.comment_body,
      }),
      ...(body.is_private !== undefined && { is_private: body.is_private }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.parent_comment_id !== undefined && {
        parent_comment_id: body.parent_comment_id ?? null,
      }),
      ...(body.shopping_mall_inquiry_id !== undefined && {
        shopping_mall_inquiry_id: body.shopping_mall_inquiry_id ?? null,
      }),
      ...(body.shopping_mall_review_id !== undefined && {
        shopping_mall_review_id: body.shopping_mall_review_id ?? null,
      }),
      ...(body.shopping_mall_memberuserid !== undefined && {
        shopping_mall_memberuserid: body.shopping_mall_memberuserid ?? null,
      }),
      ...(body.shopping_mall_guestuserid !== undefined && {
        shopping_mall_guestuserid: body.shopping_mall_guestuserid ?? null,
      }),
      ...(body.shopping_mall_selleruserid !== undefined && {
        shopping_mall_selleruserid: body.shopping_mall_selleruserid ?? null,
      }),
      updated_at: now,
    },
  });

  return {
    comment_body: updated.comment_body,
    is_private: updated.is_private,
    status: updated.status,
  };
}
