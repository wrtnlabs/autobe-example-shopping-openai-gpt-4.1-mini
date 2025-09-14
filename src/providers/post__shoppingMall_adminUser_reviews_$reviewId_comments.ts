import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallComment } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallComment";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Add a new comment to a product review.
 *
 * Creates a comment record linked to a specific product review identified by
 * reviewId. The comment body, privacy flag, and status are provided in the
 * request body.
 *
 * Requires adminUser authorization.
 *
 * @param props.adminUser - The authenticated admin user making the request.
 * @param props.reviewId - UUID of the target product review.
 * @param props.body - The comment creation data including content, privacy
 *   flag, and status.
 * @returns The created comment information.
 * @throws {Error} If database insertion fails or validation errors occur.
 */
export async function post__shoppingMall_adminUser_reviews_$reviewId_comments(props: {
  adminUser: AdminuserPayload;
  reviewId: string & tags.Format<"uuid">;
  body: IShoppingMallComment.ICreate;
}): Promise<IShoppingMallComment> {
  const { adminUser, reviewId, body } = props;

  const created = await MyGlobal.prisma.shopping_mall_comments.create({
    data: {
      id: v4() as string & tags.Format<"uuid">,
      shopping_mall_review_id: reviewId,
      comment_body: body.comment_body,
      is_private: body.is_private,
      status: body.status,
      created_at: toISOStringSafe(new Date()),
      updated_at: toISOStringSafe(new Date()),
      parent_comment_id: body.parent_comment_id ?? undefined,
      shopping_mall_inquiry_id: body.shopping_mall_inquiry_id ?? undefined,
      shopping_mall_memberuserid: body.shopping_mall_memberuserid ?? undefined,
      shopping_mall_guestuserid: body.shopping_mall_guestuserid ?? undefined,
      shopping_mall_selleruserid: body.shopping_mall_selleruserid ?? undefined,
    },
  });

  return {
    comment_body: created.comment_body,
    is_private: created.is_private,
    status: created.status,
  };
}
