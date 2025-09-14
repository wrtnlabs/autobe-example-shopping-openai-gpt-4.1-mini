import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallComment } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallComment";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Get detailed information of a specific review comment.
 *
 * Retrieves detailed information of a comment for a given product review by
 * commentId and reviewId. Returns all comment fields including content, privacy
 * flag, author member, guest, or seller, status, and timestamps. Enforcement of
 * access control restrictions to protect private comments according to user
 * roles is included.
 *
 * @param props - Object containing:
 *
 *   - MemberUser: Authenticated member user making the request
 *   - ReviewId: UUID of the product review
 *   - CommentId: UUID of the comment
 *
 * @returns Detailed review comment information matching IShoppingMallComment
 * @throws {Error} If the comment does not exist or access is unauthorized
 */
export async function get__shoppingMall_memberUser_reviews_$reviewId_comments_$commentId(props: {
  memberUser: MemberuserPayload;
  reviewId: string & tags.Format<"uuid">;
  commentId: string & tags.Format<"uuid">;
}): Promise<IShoppingMallComment> {
  const { memberUser, reviewId, commentId } = props;

  // Fetch the comment with specific reviewId and commentId ensuring non-deleted
  const comment = await MyGlobal.prisma.shopping_mall_comments.findFirstOrThrow(
    {
      where: {
        id: commentId,
        shopping_mall_review_id: reviewId,
        deleted_at: null,
      },
    },
  );

  // Enforce access control for private comments
  if (comment.is_private) {
    if (comment.shopping_mall_memberuserid !== memberUser.id) {
      throw new Error("Unauthorized: Private comment access denied");
    }
  }

  // Return only IShoppingMallComment fields
  return {
    comment_body: comment.comment_body,
    is_private: comment.is_private,
    status: comment.status,
  };
}
