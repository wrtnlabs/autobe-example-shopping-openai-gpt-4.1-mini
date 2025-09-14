import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallGuestUsers } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallGuestUsers";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Retrieves detailed information about a specific guest user session by UUID.
 *
 * Accessible only to adminUser role.
 *
 * @param props - Object containing adminUser payload and guest user session ID
 * @param props.adminUser - Authenticated admin user payload
 * @param props.id - UUID of the guest user session to retrieve
 * @returns Detailed guest user session information
 * @throws {Error} When guest user session not found
 */
export async function get__shoppingMall_adminUser_guestUsers_$id(props: {
  adminUser: AdminuserPayload;
  id: string & tags.Format<"uuid">;
}): Promise<IShoppingMallGuestUsers> {
  const { id } = props;

  const guestUser =
    await MyGlobal.prisma.shopping_mall_guestusers.findUniqueOrThrow({
      where: {
        id,
        deleted_at: null,
      },
    });

  return {
    id: guestUser.id,
    ip_address: guestUser.ip_address,
    access_url: guestUser.access_url,
    referrer: guestUser.referrer ?? null,
    user_agent: guestUser.user_agent ?? null,
    session_start_at: toISOStringSafe(guestUser.session_start_at),
    session_end_at: guestUser.session_end_at
      ? toISOStringSafe(guestUser.session_end_at)
      : null,
    created_at: toISOStringSafe(guestUser.created_at),
    updated_at: toISOStringSafe(guestUser.updated_at),
    deleted_at: guestUser.deleted_at
      ? toISOStringSafe(guestUser.deleted_at)
      : null,
  };
}
