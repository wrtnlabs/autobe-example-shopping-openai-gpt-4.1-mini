import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallComment } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallComment";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

/**
 * Get detailed information of a specific review comment.
 *
 * This operation retrieves detailed information of a single comment specified
 * by commentId linked to a specific review identified by reviewId.
 *
 * It returns comment text, privacy flags, and status.
 *
 * Access control restrictions apply to protect private comments for seller
 * users.
 *
 * @param props - Object containing the authenticated sellerUser and identifiers
 *   reviewId and commentId
 * @param props.sellerUser - Authenticated seller user making the request
 * @param props.reviewId - UUID of the product review
 * @param props.commentId - UUID of the comment to retrieve
 * @returns Detailed comment information matching IShoppingMallComment
 * @throws {Error} When the comment does not exist or is unauthorized
 */
export async function get__shoppingMall_sellerUser_reviews_$reviewId_comments_$commentId(props: {
  sellerUser: SelleruserPayload;
  reviewId: string & tags.Format<"uuid">;
  commentId: string & tags.Format<"uuid">;
}): Promise<IShoppingMallComment> {
  const { sellerUser, reviewId, commentId } = props;

  const comment = await MyGlobal.prisma.shopping_mall_comments.findFirstOrThrow(
    {
      where: {
        id: commentId,
        shopping_mall_review_id: reviewId,
        deleted_at: null,
      },
    },
  );

  if (comment.is_private) {
    if (comment.shopping_mall_selleruserid !== sellerUser.id) {
      throw new Error("Unauthorized: Cannot access private comment");
    }
  }

  return {
    comment_body: comment.comment_body,
    is_private: comment.is_private,
    status: comment.status,
  };
}
