import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

/**
 * Permanently delete a comment within a product review.
 *
 * This endpoint deletes the comment identified by commentId under the specified
 * reviewId. Only the owner of the comment (sellerUser) is authorized to perform
 * this operation.
 *
 * This is a hard delete operation with no recovery.
 *
 * @param props - Request properties
 * @param props.sellerUser - The authenticated seller user requesting deletion
 * @param props.reviewId - UUID of the target product review
 * @param props.commentId - UUID of the comment to delete
 * @throws {Error} If the comment does not belong to the specified review
 * @throws {Error} If the seller user is not the owner of the comment
 * @throws {Error} If the comment does not exist
 */
export async function delete__shoppingMall_sellerUser_reviews_$reviewId_comments_$commentId(props: {
  sellerUser: SelleruserPayload;
  reviewId: string & tags.Format<"uuid">;
  commentId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { sellerUser, reviewId, commentId } = props;

  const comment =
    await MyGlobal.prisma.shopping_mall_comments.findUniqueOrThrow({
      where: {
        id: commentId,
      },
    });

  if (comment.shopping_mall_review_id !== reviewId) {
    throw new Error("Comment does not belong to the specified review.");
  }

  if (comment.shopping_mall_selleruserid !== sellerUser.id) {
    throw new Error("Unauthorized: You can only delete your own comments.");
  }

  await MyGlobal.prisma.shopping_mall_comments.delete({
    where: {
      id: commentId,
    },
  });
}
