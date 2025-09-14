import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallChannelCategory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallChannelCategory";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Update a specific channel-category mapping by ID.
 *
 * This operation updates the linkage between a sales channel and a product
 * category, allowing modifications of which channel and category are connected.
 * Access is restricted to the authenticated admin user.
 *
 * @param props - Object containing the authenticated admin user, target ID, and
 *   update body
 * @param props.adminUser - Authenticated admin user payload
 * @param props.id - UUID of the channel-category mapping to update
 * @param props.body - Fields to update: new sales channel ID and/or product
 *   category ID
 * @returns The updated channel-category mapping with relations and timestamps
 * @throws {Error} Throws if the channel-category mapping does not exist
 */
export async function put__shoppingMall_adminUser_channelCategories_$id(props: {
  adminUser: AdminuserPayload;
  id: string & tags.Format<"uuid">;
  body: IShoppingMallChannelCategory.IUpdate;
}): Promise<IShoppingMallChannelCategory> {
  const { adminUser, id, body } = props;

  const channelCategory =
    await MyGlobal.prisma.shopping_mall_channel_categories.findUniqueOrThrow({
      where: { id },
      include: {
        channel: true,
        category: true,
      },
    });

  const updated = await MyGlobal.prisma.shopping_mall_channel_categories.update(
    {
      where: { id },
      data: {
        shopping_mall_channel_id: body.shopping_mall_channel_id ?? undefined,
        shopping_mall_category_id: body.shopping_mall_category_id ?? undefined,
      },
      include: {
        channel: true,
        category: true,
      },
    },
  );

  return {
    id: updated.id,
    shopping_mall_channel_id: updated.shopping_mall_channel_id,
    shopping_mall_category_id: updated.shopping_mall_category_id,
    created_at: toISOStringSafe(updated.created_at),
    updated_at: toISOStringSafe(updated.updated_at),
    deleted_at: updated.deleted_at
      ? toISOStringSafe(updated.deleted_at)
      : undefined,
    channel: updated.channel
      ? {
          id: updated.channel.id,
          code: updated.channel.code,
          name: updated.channel.name,
          description: updated.channel.description ?? null,
          status: updated.channel.status,
          created_at: toISOStringSafe(updated.channel.created_at),
          updated_at: toISOStringSafe(updated.channel.updated_at),
          deleted_at: updated.channel.deleted_at
            ? toISOStringSafe(updated.channel.deleted_at)
            : null,
        }
      : undefined,
    category: updated.category
      ? {
          id: updated.category.id,
          code: updated.category.code,
          name: updated.category.name,
          status: updated.category.status,
          description: updated.category.description ?? null,
          created_at: toISOStringSafe(updated.category.created_at),
          updated_at: toISOStringSafe(updated.category.updated_at),
          deleted_at: updated.category.deleted_at
            ? toISOStringSafe(updated.category.deleted_at)
            : null,
        }
      : undefined,
  };
}
