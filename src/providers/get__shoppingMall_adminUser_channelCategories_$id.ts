import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallChannelCategory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallChannelCategory";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Retrieves a detailed shopping mall channel-category mapping by its unique ID.
 *
 * This function fetches the record from the database including related channel
 * and category details, properly converting all date fields to ISO strings.
 *
 * Access is authorized for admin users only.
 *
 * @param props - Object containing the adminUser payload and the target mapping
 *   ID
 * @param props.adminUser - Authorized admin user information
 * @param props.id - Unique identifier of the channel-category mapping
 * @returns The detailed shopping mall channel-category mapping data
 * @throws {Error} Throws if the mapping is not found
 */
export async function get__shoppingMall_adminUser_channelCategories_$id(props: {
  adminUser: AdminuserPayload;
  id: string & tags.Format<"uuid">;
}): Promise<IShoppingMallChannelCategory> {
  const { id } = props;

  const record =
    await MyGlobal.prisma.shopping_mall_channel_categories.findUniqueOrThrow({
      where: { id },
      include: {
        channel: true,
        category: true,
      },
    });

  return {
    id: record.id,
    shopping_mall_channel_id: record.shopping_mall_channel_id,
    shopping_mall_category_id: record.shopping_mall_category_id,
    created_at: toISOStringSafe(record.created_at),
    updated_at: toISOStringSafe(record.updated_at),
    deleted_at: record.deleted_at ? toISOStringSafe(record.deleted_at) : null,
    channel: record.channel
      ? {
          id: record.channel.id,
          code: record.channel.code,
          name: record.channel.name,
          description: record.channel.description ?? null,
          status: record.channel.status,
          created_at: toISOStringSafe(record.channel.created_at),
          updated_at: toISOStringSafe(record.channel.updated_at),
          deleted_at: record.channel.deleted_at
            ? toISOStringSafe(record.channel.deleted_at)
            : null,
        }
      : undefined,
    category: record.category
      ? {
          id: record.category.id,
          code: record.category.code,
          name: record.category.name,
          status: record.category.status,
          description: record.category.description ?? null,
          created_at: toISOStringSafe(record.category.created_at),
          updated_at: toISOStringSafe(record.category.updated_at),
          deleted_at: record.category.deleted_at
            ? toISOStringSafe(record.category.deleted_at)
            : null,
        }
      : undefined,
  };
}
