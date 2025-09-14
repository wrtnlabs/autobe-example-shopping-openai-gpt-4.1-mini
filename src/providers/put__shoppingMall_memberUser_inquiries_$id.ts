import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallInquiry } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallInquiry";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Update a product inquiry record by ID.
 *
 * This function updates inquiry content, privacy, answered flag, and status.
 * Authorization is enforced: only the memberUser owner can update.
 *
 * @param props - Object containing:
 *
 *   - MemberUser: authenticated member user with id
 *   - Id: inquiry ID (UUID format) to update
 *   - Body: update data for inquiry
 *
 * @returns Updated inquiry record
 * @throws {Error} Throws when inquiry not found or unauthorized
 */
export async function put__shoppingMall_memberUser_inquiries_$id(props: {
  memberUser: MemberuserPayload;
  id: string & tags.Format<"uuid">;
  body: IShoppingMallInquiry.IUpdate;
}): Promise<IShoppingMallInquiry> {
  const { memberUser, id, body } = props;

  const inquiry = await MyGlobal.prisma.shopping_mall_inquiries.findUnique({
    where: { id },
  });

  if (!inquiry) throw new Error("Not found");

  if (inquiry.shopping_mall_memberuserid !== memberUser.id) {
    throw new Error("Unauthorized");
  }

  const updated = await MyGlobal.prisma.shopping_mall_inquiries.update({
    where: { id },
    data: {
      shopping_mall_channel_id: body.shopping_mall_channel_id ?? undefined,
      shopping_mall_section_id: body.shopping_mall_section_id ?? undefined,
      shopping_mall_category_id: body.shopping_mall_category_id ?? undefined,
      shopping_mall_memberuserid: body.shopping_mall_memberuserid ?? undefined,
      shopping_mall_guestuserid: body.shopping_mall_guestuserid ?? undefined,
      parent_inquiry_id: body.parent_inquiry_id ?? undefined,
      inquiry_title: body.inquiry_title ?? undefined,
      inquiry_body: body.inquiry_body ?? undefined,
      is_private: body.is_private ?? undefined,
      is_answered: body.is_answered ?? undefined,
      status: body.status ?? undefined,
      updated_at: toISOStringSafe(new Date()),
    },
  });

  return {
    id: updated.id,
    shopping_mall_channel_id: updated.shopping_mall_channel_id,
    shopping_mall_section_id: updated.shopping_mall_section_id ?? null,
    shopping_mall_category_id: updated.shopping_mall_category_id ?? null,
    shopping_mall_memberuserid: updated.shopping_mall_memberuserid ?? null,
    shopping_mall_guestuserid: updated.shopping_mall_guestuserid ?? null,
    parent_inquiry_id: updated.parent_inquiry_id ?? null,
    inquiry_title: updated.inquiry_title,
    inquiry_body: updated.inquiry_body,
    is_private: updated.is_private,
    is_answered: updated.is_answered,
    status: updated.status,
    created_at: toISOStringSafe(updated.created_at),
    updated_at: toISOStringSafe(updated.updated_at),
    deleted_at: updated.deleted_at ? toISOStringSafe(updated.deleted_at) : null,
  };
}
