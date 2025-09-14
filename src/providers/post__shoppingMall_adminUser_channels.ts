import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallChannel } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallChannel";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Creates a new shopping mall sales channel.
 *
 * This operation creates a new sales channel in the shopping mall backend.
 *
 * Required data includes unique code, name, optional description, and current
 * status.
 *
 * Only authenticated admin users may perform this operation.
 *
 * Validation ensures the uniqueness of the channel code.
 *
 * @param props - Object containing the authenticated admin user and the channel
 *   creation data
 * @param props.adminUser - The authenticated admin user performing the creation
 * @param props.body - The channel data to create (code, name, optional
 *   description, status)
 * @returns The newly created shopping mall channel with all relevant fields
 * @throws {Error} When a channel with the same code already exists
 */
export async function post__shoppingMall_adminUser_channels(props: {
  adminUser: AdminuserPayload;
  body: IShoppingMallChannel.ICreate;
}): Promise<IShoppingMallChannel> {
  const { adminUser, body } = props;

  const existing = await MyGlobal.prisma.shopping_mall_channels.findFirst({
    where: { code: body.code, deleted_at: null },
  });
  if (existing) {
    throw new Error(`Channel with code '${body.code}' already exists.`);
  }

  const now: string & tags.Format<"date-time"> = toISOStringSafe(new Date());

  const created = await MyGlobal.prisma.shopping_mall_channels.create({
    data: {
      id: v4(),
      code: body.code,
      name: body.name,
      description: body.description ?? null,
      status: body.status,
      created_at: now,
      updated_at: now,
    },
  });

  return {
    id: created.id,
    code: created.code,
    name: created.name,
    description: created.description,
    status: created.status,
    created_at: toISOStringSafe(created.created_at),
    updated_at: toISOStringSafe(created.updated_at),
    deleted_at: created.deleted_at ? toISOStringSafe(created.deleted_at) : null,
  };
}
