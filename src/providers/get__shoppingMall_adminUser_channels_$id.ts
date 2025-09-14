import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallChannel } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallChannel";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Retrieve detailed information of a sales channel by its unique ID.
 *
 * This operation fetches all attributes for a shopping mall sales channel,
 * including code, name, optional description, status, and timestamps.
 *
 * Access is restricted to authenticated admin users.
 *
 * @param props - Object containing
 *
 *   - AdminUser: Authenticated admin user payload
 *   - Id: Unique UUID identifier of the sales channel
 *
 * @returns Detailed IShoppingMallChannel object
 * @throws {Error} If no channel found or unauthorized access
 */
export async function get__shoppingMall_adminUser_channels_$id(props: {
  adminUser: AdminuserPayload;
  id: string & tags.Format<"uuid">;
}): Promise<IShoppingMallChannel> {
  const channel =
    await MyGlobal.prisma.shopping_mall_channels.findUniqueOrThrow({
      where: {
        id: props.id,
        deleted_at: null,
      },
    });

  return {
    id: channel.id,
    code: channel.code,
    name: channel.name,
    description: channel.description ?? null,
    status: channel.status,
    created_at: toISOStringSafe(channel.created_at),
    updated_at: toISOStringSafe(channel.updated_at),
    deleted_at: channel.deleted_at ? toISOStringSafe(channel.deleted_at) : null,
  };
}
