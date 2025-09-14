import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Permanently delete a comment within a product review.
 *
 * This operation deletes the comment record identified by commentId under the
 * review specified by reviewId. Only the owning member user can perform this
 * action to maintain content integrity.
 *
 * @param props - Object containing required properties
 * @param props.memberUser - The authenticated member user performing deletion
 * @param props.reviewId - UUID of the product review
 * @param props.commentId - UUID of the comment to delete
 * @throws {Error} When the comment is not found
 * @throws {Error} When the member user is unauthorized to delete the comment
 */
export async function delete__shoppingMall_memberUser_reviews_$reviewId_comments_$commentId(props: {
  memberUser: MemberuserPayload;
  reviewId: string & tags.Format<"uuid">;
  commentId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { memberUser, reviewId, commentId } = props;

  // Find the comment with matching id and reviewId
  const comment = await MyGlobal.prisma.shopping_mall_comments.findFirst({
    where: {
      id: commentId,
      shopping_mall_review_id: reviewId,
    },
  });

  if (!comment) {
    throw new Error("Comment not found");
  }

  // Authorization check: ensure the comment belongs to the authenticated memberUser
  if (comment.shopping_mall_memberuserid !== memberUser.id) {
    throw new Error("Unauthorized: Cannot delete comment not owned by you");
  }

  // Perform hard delete of the comment
  await MyGlobal.prisma.shopping_mall_comments.delete({
    where: { id: commentId },
  });
}
