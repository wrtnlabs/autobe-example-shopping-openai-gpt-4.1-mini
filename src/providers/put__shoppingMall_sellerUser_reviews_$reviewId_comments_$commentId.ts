import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallComment } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallComment";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

/**
 * Modify a product review comment
 *
 * Update a comment on a product review identified by reviewId and commentId.
 *
 * The updated content, privacy setting, and status are in the request body.
 *
 * Access control restricts updates to authorized users.
 *
 * Returns the updated comment details.
 *
 * @param props - Object containing sellerUser (authenticated user), reviewId,
 *   commentId, and body for update
 * @returns The updated IShoppingMallComment
 * @throws {Error} When comment is not found
 * @throws {Error} When unauthorized to update
 */
export async function put__shoppingMall_sellerUser_reviews_$reviewId_comments_$commentId(props: {
  sellerUser: SelleruserPayload;
  reviewId: string & tags.Format<"uuid">;
  commentId: string & tags.Format<"uuid">;
  body: IShoppingMallComment.IUpdate;
}): Promise<IShoppingMallComment> {
  const { sellerUser, reviewId, commentId, body } = props;

  const comment = await MyGlobal.prisma.shopping_mall_comments.findFirst({
    where: {
      id: commentId,
      shopping_mall_review_id: reviewId,
      deleted_at: null,
    },
  });

  if (!comment) throw new Error("Comment not found");

  if (comment.shopping_mall_selleruserid !== sellerUser.id) {
    throw new Error("Unauthorized to update this comment");
  }

  const now = toISOStringSafe(new Date());

  const updated = await MyGlobal.prisma.shopping_mall_comments.update({
    where: { id: commentId },
    data: {
      comment_body: body.comment_body ?? undefined,
      is_private: body.is_private ?? undefined,
      status: body.status ?? undefined,
      parent_comment_id:
        body.parent_comment_id === null
          ? null
          : (body.parent_comment_id ?? undefined),
      updated_at: now,
    },
  });

  return {
    comment_body: updated.comment_body,
    is_private: updated.is_private,
    status: updated.status,
  };
}
