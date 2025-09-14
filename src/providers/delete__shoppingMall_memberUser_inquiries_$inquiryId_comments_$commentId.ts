import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Delete a comment under a specific inquiry.
 *
 * This operation performs a hard delete removing the comment identified by
 * commentId under the specified inquiry identified by inquiryId.
 *
 * Authorization requires the member user to own the comment.
 *
 * Deleted comments cannot be recovered.
 *
 * @param props - Object containing the authenticated memberUser, inquiryId, and
 *   commentId.
 * @param props.memberUser - Authenticated member user performing the deletion.
 * @param props.inquiryId - UUID of the inquiry the comment belongs to.
 * @param props.commentId - UUID of the comment to delete.
 * @throws {Error} If the comment is not found under the inquiry.
 * @throws {Error} If the member user is not authorized to delete the comment.
 */
export async function delete__shoppingMall_memberUser_inquiries_$inquiryId_comments_$commentId(props: {
  memberUser: MemberuserPayload;
  inquiryId: string & tags.Format<"uuid">;
  commentId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { memberUser, inquiryId, commentId } = props;

  const comment = await MyGlobal.prisma.shopping_mall_comments.findFirst({
    where: {
      id: commentId,
      shopping_mall_inquiry_id: inquiryId,
    },
  });

  if (!comment)
    throw new Error("Comment not found under the specified inquiry");

  if (comment.shopping_mall_memberuserid !== memberUser.id) {
    throw new Error("Unauthorized: You can only delete your own comments");
  }

  await MyGlobal.prisma.shopping_mall_comments.delete({
    where: { id: commentId },
  });
}
