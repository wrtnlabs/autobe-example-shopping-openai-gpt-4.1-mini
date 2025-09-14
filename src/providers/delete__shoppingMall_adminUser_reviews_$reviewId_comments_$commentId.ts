import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Permanently deletes a comment within a product review.
 *
 * This operation removes the comment record identified by `commentId` under the
 * product review specified by `reviewId`.
 *
 * Only authorized admin users may perform this operation. The authorization is
 * presumed by the presence of `adminUser` in `props`.
 *
 * @param props - Object containing adminUser credentials and identifiers
 * @param props.adminUser - Authenticated admin user performing the deletion
 * @param props.reviewId - UUID of the product review
 * @param props.commentId - UUID of the comment to delete
 * @throws {Error} When the comment is not found or does not belong to the given
 *   review
 */
export async function delete__shoppingMall_adminUser_reviews_$reviewId_comments_$commentId(props: {
  adminUser: AdminuserPayload;
  reviewId: string & tags.Format<"uuid">;
  commentId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { adminUser, reviewId, commentId } = props;

  const comment = await MyGlobal.prisma.shopping_mall_comments.findUnique({
    where: { id: commentId },
  });
  if (!comment) throw new Error("Unauthorized or comment not found");

  if (comment.shopping_mall_review_id !== reviewId) {
    throw new Error("Unauthorized or comment not found");
  }

  await MyGlobal.prisma.shopping_mall_comments.delete({
    where: { id: commentId },
  });
}
