import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallComment } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallComment";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Modify a product review comment
 *
 * Update a comment on a product review identified by reviewId and commentId.
 *
 * The updated content, privacy setting, and status are in the request body.
 *
 * Access control restricts updates to authorized users (the comment author).
 *
 * @param props - Object containing memberUser, reviewId, commentId, and update
 *   body
 * @returns The updated comment details
 * @throws {Error} When the comment does not belong to the authenticated
 *   memberUser
 */
export async function put__shoppingMall_memberUser_reviews_$reviewId_comments_$commentId(props: {
  memberUser: MemberuserPayload;
  reviewId: string & tags.Format<"uuid">;
  commentId: string & tags.Format<"uuid">;
  body: IShoppingMallComment.IUpdate;
}): Promise<IShoppingMallComment> {
  const { memberUser, reviewId, commentId, body } = props;

  // Retrieve the comment to verify ownership and existence
  const comment =
    await MyGlobal.prisma.shopping_mall_comments.findUniqueOrThrow({
      where: { id: commentId, shopping_mall_review_id: reviewId },
    });

  // Authorization check: Only the comment author can update
  if (comment.shopping_mall_memberuserid !== memberUser.id) {
    throw new Error("Unauthorized: You can only update your own comments");
  }

  // Perform the update with allowed fields only
  const updated = await MyGlobal.prisma.shopping_mall_comments.update({
    where: { id: commentId },
    data: {
      comment_body: body.comment_body ?? undefined,
      is_private: body.is_private ?? undefined,
      status: body.status ?? undefined,
      updated_at: toISOStringSafe(new Date()),
    },
  });

  // Return the updated comment details
  return {
    comment_body: updated.comment_body,
    is_private: updated.is_private,
    status: updated.status,
  };
}
