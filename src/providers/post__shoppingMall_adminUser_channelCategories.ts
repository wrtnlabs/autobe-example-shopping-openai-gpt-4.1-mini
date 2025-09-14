import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallChannelCategory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallChannelCategory";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Create a new channel-category mapping in the shopping mall system.
 *
 * Links a product category to a sales channel for multi-channel categorization.
 *
 * Requires authenticated admin user.
 *
 * @param props - Contains adminUser authentication and body creation data.
 * @returns The created channel-category mapping with nested channel and
 *   category info.
 */
export async function post__shoppingMall_adminUser_channelCategories(props: {
  adminUser: AdminuserPayload;
  body: IShoppingMallChannelCategory.ICreate;
}): Promise<IShoppingMallChannelCategory> {
  const { body } = props;

  const now = toISOStringSafe(new Date());
  const id = v4() as string & import("typia").tags.Format<"uuid">;

  const created = await MyGlobal.prisma.shopping_mall_channel_categories.create(
    {
      data: {
        id,
        shopping_mall_channel_id: body.shopping_mall_channel_id,
        shopping_mall_category_id: body.shopping_mall_category_id,
        created_at: now,
        updated_at: now,
      },
      select: {
        id: true,
        shopping_mall_channel_id: true,
        shopping_mall_category_id: true,
        created_at: true,
        updated_at: true,
        deleted_at: true,
        channel: {
          select: {
            id: true,
            code: true,
            name: true,
            description: true,
            status: true,
            created_at: true,
            updated_at: true,
            deleted_at: true,
          },
        },
        category: {
          select: {
            id: true,
            code: true,
            name: true,
            status: true,
            description: true,
            created_at: true,
            updated_at: true,
            deleted_at: true,
          },
        },
      },
    },
  );

  return {
    id: created.id,
    shopping_mall_channel_id: created.shopping_mall_channel_id,
    shopping_mall_category_id: created.shopping_mall_category_id,
    created_at: toISOStringSafe(created.created_at),
    updated_at: toISOStringSafe(created.updated_at),
    deleted_at: created.deleted_at ? toISOStringSafe(created.deleted_at) : null,
    channel: created.channel
      ? {
          id: created.channel.id,
          code: created.channel.code,
          name: created.channel.name,
          description: created.channel.description ?? null,
          status: created.channel.status,
          created_at: toISOStringSafe(created.channel.created_at),
          updated_at: toISOStringSafe(created.channel.updated_at),
          deleted_at: created.channel.deleted_at
            ? toISOStringSafe(created.channel.deleted_at)
            : null,
        }
      : undefined,
    category: created.category
      ? {
          id: created.category.id,
          code: created.category.code,
          name: created.category.name,
          status: created.category.status,
          description: created.category.description ?? null,
          created_at: toISOStringSafe(created.category.created_at),
          updated_at: toISOStringSafe(created.category.updated_at),
          deleted_at: created.category.deleted_at
            ? toISOStringSafe(created.category.deleted_at)
            : null,
        }
      : undefined,
  };
}
