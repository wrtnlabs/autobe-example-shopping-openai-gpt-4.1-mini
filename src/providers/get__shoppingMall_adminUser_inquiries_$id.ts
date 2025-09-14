import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallInquiry } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallInquiry";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Get product inquiry by ID
 *
 * Retrieves detailed information of a single product inquiry by its ID. This
 * includes all inquiry properties like title, body, privacy, status, and
 * relationships such as channel, section, category, and associated users.
 *
 * Authorization:
 *
 * - Requires authenticated admin user.
 * - Admin users have access to all inquiries, including private ones.
 *
 * @param props - Object containing parameters
 * @param props.adminUser - The authenticated admin user making the request
 * @param props.id - Unique identifier (UUID) of the target inquiry
 * @returns The detailed product inquiry matching the ID
 * @throws {Error} If the inquiry is not found or has been deleted
 */
export async function get__shoppingMall_adminUser_inquiries_$id(props: {
  adminUser: AdminuserPayload;
  id: string & tags.Format<"uuid">;
}): Promise<IShoppingMallInquiry> {
  const { id } = props;

  const inquiry =
    await MyGlobal.prisma.shopping_mall_inquiries.findUniqueOrThrow({
      where: { id },
    });

  if (inquiry.deleted_at !== null) throw new Error("Inquiry not found");

  return {
    id: inquiry.id,
    shopping_mall_channel_id: inquiry.shopping_mall_channel_id,
    shopping_mall_section_id: inquiry.shopping_mall_section_id ?? null,
    shopping_mall_category_id: inquiry.shopping_mall_category_id ?? null,
    shopping_mall_memberuserid: inquiry.shopping_mall_memberuserid ?? null,
    shopping_mall_guestuserid: inquiry.shopping_mall_guestuserid ?? null,
    parent_inquiry_id: inquiry.parent_inquiry_id ?? null,
    inquiry_title: inquiry.inquiry_title,
    inquiry_body: inquiry.inquiry_body,
    is_private: inquiry.is_private,
    is_answered: inquiry.is_answered,
    status: inquiry.status,
    created_at: toISOStringSafe(inquiry.created_at),
    updated_at: toISOStringSafe(inquiry.updated_at),
    deleted_at: inquiry.deleted_at ? toISOStringSafe(inquiry.deleted_at) : null,
  };
}
