import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallComment } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallComment";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Create a new comment under a specific inquiry identified by inquiryId.
 *
 * This operation validates that the inquiry exists and is not deleted. It
 * creates a comment linked to the inquiry, associating it with the
 * authenticated member user. The comment includes body content, privacy
 * settings, status, and timestamps.
 *
 * @param props - Object containing memberUser, inquiryId, and body properties
 * @returns The newly created comment details including comment_body,
 *   is_private, and status
 * @throws {Error} When the inquiry does not exist or is deleted
 */
export async function post__shoppingMall_memberUser_inquiries_$inquiryId_comments(props: {
  memberUser: MemberuserPayload;
  inquiryId: string & tags.Format<"uuid">;
  body: IShoppingMallComment.ICreate;
}): Promise<IShoppingMallComment> {
  const { memberUser, inquiryId, body } = props;

  // Verify inquiry exists
  const inquiry = await MyGlobal.prisma.shopping_mall_inquiries.findUnique({
    where: { id: inquiryId },
  });
  if (!inquiry || inquiry.deleted_at !== null) {
    throw new Error("Inquiry not found");
  }

  const commentId = v4() as string & tags.Format<"uuid">;
  const now = toISOStringSafe(new Date());

  const created = await MyGlobal.prisma.shopping_mall_comments.create({
    data: {
      id: commentId,
      shopping_mall_inquiry_id: inquiryId,
      shopping_mall_memberuserid: memberUser.id,
      shopping_mall_review_id: null,
      shopping_mall_guestuserid: null,
      shopping_mall_selleruserid: null,
      parent_comment_id: body.parent_comment_id ?? null,
      comment_body: body.comment_body,
      is_private: body.is_private,
      status: body.status,
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
