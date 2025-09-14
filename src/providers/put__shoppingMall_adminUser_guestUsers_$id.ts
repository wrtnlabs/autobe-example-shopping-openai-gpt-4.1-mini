import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallGuestUsers } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallGuestUsers";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Update guest user session metadata
 *
 * Updates session and connection metadata for a guest user session identified
 * by UUID. Requires adminUser authentication.
 *
 * @param props - Request properties
 * @param props.adminUser - The authenticated admin user making the request
 * @param props.id - UUID of the guest user session to update
 * @param props.body - Guest user update information
 * @returns The updated guest user session record
 * @throws {Error} When the guest user session is not found
 */
export async function put__shoppingMall_adminUser_guestUsers_$id(props: {
  adminUser: AdminuserPayload;
  id: string & tags.Format<"uuid">;
  body: IShoppingMallGuestUsers.IUpdate;
}): Promise<IShoppingMallGuestUsers> {
  const { adminUser, id, body } = props;

  // Check for existing guest user session (not deleted)
  const existing = await MyGlobal.prisma.shopping_mall_guestusers.findFirst({
    where: { id, deleted_at: null },
  });
  if (!existing) throw new Error("Guest user session not found");

  // Update the record with fields provided in body
  const updated = await MyGlobal.prisma.shopping_mall_guestusers.update({
    where: { id },
    data: {
      ip_address: body.ip_address ?? undefined,
      access_url: body.access_url ?? undefined,
      referrer: body.referrer ?? undefined,
      user_agent: body.user_agent ?? undefined,
      session_start_at: body.session_start_at ?? undefined,
      session_end_at: body.session_end_at ?? undefined,
      created_at: body.created_at ?? undefined,
      updated_at: body.updated_at ?? undefined,
      deleted_at: body.deleted_at ?? undefined,
    },
  });

  // Return updated record with correct date string conversions
  return {
    id: updated.id,
    ip_address: updated.ip_address,
    access_url: updated.access_url,
    referrer: updated.referrer ?? null,
    user_agent: updated.user_agent ?? null,
    session_start_at: toISOStringSafe(updated.session_start_at),
    session_end_at: updated.session_end_at
      ? toISOStringSafe(updated.session_end_at)
      : null,
    created_at: toISOStringSafe(updated.created_at),
    updated_at: toISOStringSafe(updated.updated_at),
    deleted_at: updated.deleted_at ? toISOStringSafe(updated.deleted_at) : null,
  };
}
