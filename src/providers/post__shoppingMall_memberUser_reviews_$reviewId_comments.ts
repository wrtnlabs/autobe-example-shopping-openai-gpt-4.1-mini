import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallComment } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallComment";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

export async function post__shoppingMall_memberUser_reviews_$reviewId_comments(props: {
  memberUser: MemberuserPayload;
  reviewId: string & tags.Format<"uuid">;
  body: IShoppingMallComment.ICreate;
}): Promise<IShoppingMallComment> {
  const { memberUser, reviewId, body } = props;

  const review = await MyGlobal.prisma.shopping_mall_reviews.findUnique({
    where: { id: reviewId },
  });
  if (!review) throw new Error(`Review not found: ${reviewId}`);

  const now: string & tags.Format<"date-time"> = toISOStringSafe(new Date());
  const newId: string & tags.Format<"uuid"> = v4() as string &
    tags.Format<"uuid">;

  const created = await MyGlobal.prisma.shopping_mall_comments.create({
    data: {
      id: newId,
      shopping_mall_review_id: reviewId,
      shopping_mall_memberuserid: memberUser.id,
      shopping_mall_guestuserid: null,
      shopping_mall_selleruserid: null,
      shopping_mall_inquiry_id: null,
      parent_comment_id: body.parent_comment_id ?? null,
      comment_body: body.comment_body,
      is_private: body.is_private,
      status: body.status,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    },
  });

  return {
    comment_body: created.comment_body,
    is_private: created.is_private,
    status: created.status,
  };
}
