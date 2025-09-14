import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallInquiry } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallInquiry";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Creates a new shopping mall product inquiry submitted by an authenticated
 * member user.
 *
 * @param props - The function parameters.
 * @param props.memberUser - Authenticated member user payload.
 * @param props.body - The inquiry creation data.
 * @returns Newly created shopping mall inquiry record.
 * @throws {Error} Throws if database operation fails or required fields are
 *   missing.
 */
export async function post__shoppingMall_memberUser_inquiries(props: {
  memberUser: MemberuserPayload;
  body: IShoppingMallInquiry.ICreate;
}): Promise<IShoppingMallInquiry> {
  const { memberUser, body } = props;

  // Prepare timestamps
  const now = toISOStringSafe(new Date());

  // Create the inquiry record in the database
  const created = await MyGlobal.prisma.shopping_mall_inquiries.create({
    data: {
      id: v4() as string & tags.Format<"uuid">,
      shopping_mall_channel_id: body.shopping_mall_channel_id,
      shopping_mall_section_id: body.shopping_mall_section_id ?? null,
      shopping_mall_category_id: body.shopping_mall_category_id ?? null,
      shopping_mall_memberuserid: memberUser.id,
      shopping_mall_guestuserid: null,
      parent_inquiry_id: body.parent_inquiry_id ?? null,
      inquiry_title: body.inquiry_title,
      inquiry_body: body.inquiry_body,
      is_private: body.is_private,
      is_answered: body.is_answered ?? false,
      status: body.status,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    },
  });

  // Return the created inquiry with proper date-time string formatting
  return {
    id: created.id,
    shopping_mall_channel_id: created.shopping_mall_channel_id,
    shopping_mall_section_id: created.shopping_mall_section_id ?? null,
    shopping_mall_category_id: created.shopping_mall_category_id ?? null,
    shopping_mall_memberuserid: created.shopping_mall_memberuserid ?? null,
    shopping_mall_guestuserid: created.shopping_mall_guestuserid ?? null,
    parent_inquiry_id: created.parent_inquiry_id ?? null,
    inquiry_title: created.inquiry_title,
    inquiry_body: created.inquiry_body,
    is_private: created.is_private,
    is_answered: created.is_answered,
    status: created.status,
    created_at: toISOStringSafe(created.created_at),
    updated_at: toISOStringSafe(created.updated_at),
    deleted_at: created.deleted_at ? toISOStringSafe(created.deleted_at) : null,
  };
}
