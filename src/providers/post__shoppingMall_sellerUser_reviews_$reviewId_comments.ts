import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallComment } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallComment";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

/**
 * Add a new comment to a product review
 *
 * Creates a comment entity linked to the specified review ID. Only authorized
 * seller users may perform this operation.
 *
 * @param props - Object containing the sellerUser, reviewId, and comment
 *   creation body
 * @param props.sellerUser - Authenticated seller user payload
 * @param props.reviewId - UUID of the target product review
 * @param props.body - Data containing comment content, privacy settings, and
 *   status
 * @returns Newly created IShoppingMallComment record
 * @throws Error if creation fails or inputs are invalid
 */
export async function post__shoppingMall_sellerUser_reviews_$reviewId_comments(props: {
  sellerUser: SelleruserPayload;
  reviewId: string & tags.Format<"uuid">;
  body: IShoppingMallComment.ICreate;
}): Promise<IShoppingMallComment> {
  const { sellerUser, reviewId, body } = props;

  const newId = v4() as string & tags.Format<"uuid">;
  const now = toISOStringSafe(new Date());

  const created = await MyGlobal.prisma.shopping_mall_comments.create({
    data: {
      id: newId,
      comment_body: body.comment_body,
      is_private: body.is_private,
      status: body.status,
      shopping_mall_review_id: reviewId,
      shopping_mall_selleruserid: sellerUser.id,
      parent_comment_id: body.parent_comment_id ?? null,
      shopping_mall_inquiry_id: body.shopping_mall_inquiry_id ?? null,
      shopping_mall_memberuserid: body.shopping_mall_memberuserid ?? null,
      shopping_mall_guestuserid: body.shopping_mall_guestuserid ?? null,
      created_at: now,
      updated_at: now,
    },
  });

  return {
    comment_body: created.comment_body,
    is_private: created.is_private,
    status: created.status,
  };
}
