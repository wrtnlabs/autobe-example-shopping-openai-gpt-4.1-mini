import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallChannel } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallChannel";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Update an existing shopping mall sales channel.
 *
 * Allows an authenticated admin user to update the channel details identified
 * by UUID. Validates the uniqueness of channel code if changed.
 *
 * @param props - Object containing admin user, channel ID, and update data
 * @param props.adminUser - The authenticated admin user performing the update
 * @param props.id - UUID of the channel to update
 * @param props.body - Partial data for channel update
 * @returns The updated shopping mall sales channel with all fields
 * @throws {Error} When channel with specified ID is not found
 * @throws {Error} When updated code conflicts with another channel
 */
export async function put__shoppingMall_adminUser_channels_$id(props: {
  adminUser: AdminuserPayload;
  id: string & tags.Format<"uuid">;
  body: IShoppingMallChannel.IUpdate;
}): Promise<IShoppingMallChannel> {
  const { adminUser, id, body } = props;

  const existing = await MyGlobal.prisma.shopping_mall_channels.findUnique({
    where: { id },
    select: { id: true, code: true },
  });

  if (!existing)
    throw new Error(`Shopping mall channel with id ${id} not found.`);

  if (body.code !== undefined && body.code !== existing.code) {
    const duplicate = await MyGlobal.prisma.shopping_mall_channels.findFirst({
      where: { code: body.code },
    });
    if (duplicate) throw new Error(`Code '${body.code}' is already taken.`);
  }

  const updated = await MyGlobal.prisma.shopping_mall_channels.update({
    where: { id },
    data: {
      code: body.code ?? undefined,
      name: body.name ?? undefined,
      description: body.description ?? undefined,
      status: body.status ?? undefined,
      deleted_at: body.deleted_at ?? undefined,
      updated_at: toISOStringSafe(new Date()),
    },
  });

  return {
    id: updated.id,
    code: updated.code,
    name: updated.name,
    description: updated.description ?? null,
    status: updated.status,
    created_at: toISOStringSafe(updated.created_at),
    updated_at: toISOStringSafe(updated.updated_at),
    deleted_at: updated.deleted_at ? toISOStringSafe(updated.deleted_at) : null,
  };
}
