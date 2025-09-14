import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallComment } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallComment";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Get detailed information of a specific review comment.
 *
 * Retrieves detailed information of a comment linked to a product review,
 * specified by commentId and reviewId. Returns comment body, privacy flag, and
 * current status.
 *
 * Access is restricted to authenticated admin users.
 *
 * @param props - Object containing adminUser payload, reviewId and commentId.
 * @param props.adminUser - The authenticated admin user making the request.
 * @param props.reviewId - The UUID of the related product review.
 * @param props.commentId - The UUID of the comment to retrieve.
 * @returns Detailed comment information matching IShoppingMallComment
 *   structure.
 * @throws {Error} Throws if comment not found or other database errors.
 */
export async function get__shoppingMall_adminUser_reviews_$reviewId_comments_$commentId(props: {
  adminUser: AdminuserPayload;
  reviewId: string & tags.Format<"uuid">;
  commentId: string & tags.Format<"uuid">;
}): Promise<IShoppingMallComment> {
  const { adminUser, reviewId, commentId } = props;

  const comment = await MyGlobal.prisma.shopping_mall_comments.findFirstOrThrow(
    {
      where: {
        id: commentId,
        shopping_mall_review_id: reviewId,
        deleted_at: null,
      },
      select: {
        comment_body: true,
        is_private: true,
        status: true,
      },
    },
  );

  return comment;
}
