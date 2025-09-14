import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallComment } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallComment";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Get detailed information of a specific comment by its ID and parent inquiry
 * ID.
 *
 * This operation retrieves the comment content, privacy flag, and status from
 * the shopping_mall_comments table for the given inquiry and comment IDs. Only
 * authorized admin users can perform this operation.
 *
 * @param props - Object containing the authenticated admin user and identifiers
 * @param props.adminUser - The authenticated admin user performing the request
 * @param props.inquiryId - UUID of the parent inquiry to which the comment
 *   belongs
 * @param props.commentId - UUID of the comment to retrieve
 * @returns The detailed comment information matching IShoppingMallComment
 * @throws {Error} Throws if the comment is not found
 */
export async function get__shoppingMall_adminUser_inquiries_$inquiryId_comments_$commentId(props: {
  adminUser: AdminuserPayload;
  inquiryId: string & tags.Format<"uuid">;
  commentId: string & tags.Format<"uuid">;
}): Promise<IShoppingMallComment> {
  const { inquiryId, commentId } = props;

  const comment = await MyGlobal.prisma.shopping_mall_comments.findFirstOrThrow(
    {
      where: {
        id: commentId,
        shopping_mall_inquiry_id: inquiryId,
        deleted_at: null,
      },
      select: {
        comment_body: true,
        is_private: true,
        status: true,
      },
    },
  );

  return {
    comment_body: comment.comment_body,
    is_private: comment.is_private,
    status: comment.status,
  };
}
