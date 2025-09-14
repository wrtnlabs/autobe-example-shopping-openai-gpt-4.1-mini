import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallComment } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallComment";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Modify a product review comment
 *
 * Updates a comment on a product review identified by reviewId and commentId.
 * Only authorized admin users may perform updates. Updates may include comment
 * content, privacy flag, status, and associated metadata.
 *
 * @param props - Object containing the adminUser payload, reviewId, commentId,
 *   and update body
 * @param props.adminUser - The authenticated admin user performing the update
 * @param props.reviewId - UUID of the product review
 * @param props.commentId - UUID of the comment to update
 * @param props.body - The update data for the comment
 * @returns The updated comment details
 * @throws {Error} When the comment is not found
 */
export async function put__shoppingMall_adminUser_reviews_$reviewId_comments_$commentId(props: {
  adminUser: AdminuserPayload;
  reviewId: string & tags.Format<"uuid">;
  commentId: string & tags.Format<"uuid">;
  body: IShoppingMallComment.IUpdate;
}): Promise<IShoppingMallComment> {
  const { adminUser, reviewId, commentId, body } = props;

  const now = toISOStringSafe(new Date());

  // Find the comment by id and review id, ensure it is not soft-deleted
  await MyGlobal.prisma.shopping_mall_comments.findFirstOrThrow({
    where: {
      id: commentId,
      shopping_mall_review_id: reviewId,
      deleted_at: null,
    },
  });

  // Update only the provided fields
  const updated = await MyGlobal.prisma.shopping_mall_comments.update({
    where: { id: commentId },
    data: {
      ...(body.comment_body !== undefined && {
        comment_body: body.comment_body,
      }),
      ...(body.is_private !== undefined && { is_private: body.is_private }),
      ...(body.status !== undefined && { status: body.status }),
      ...(body.parent_comment_id !== undefined && {
        parent_comment_id: body.parent_comment_id,
      }),
      ...(body.shopping_mall_inquiry_id !== undefined && {
        shopping_mall_inquiry_id: body.shopping_mall_inquiry_id,
      }),
      ...(body.shopping_mall_review_id !== undefined && {
        shopping_mall_review_id: body.shopping_mall_review_id,
      }),
      ...(body.shopping_mall_memberuserid !== undefined && {
        shopping_mall_memberuserid: body.shopping_mall_memberuserid,
      }),
      ...(body.shopping_mall_guestuserid !== undefined && {
        shopping_mall_guestuserid: body.shopping_mall_guestuserid,
      }),
      ...(body.shopping_mall_selleruserid !== undefined && {
        shopping_mall_selleruserid: body.shopping_mall_selleruserid,
      }),
      updated_at: now,
    },
  });

  return {
    comment_body: updated.comment_body,
    is_private: updated.is_private,
    status: updated.status,
  };
}
