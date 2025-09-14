import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallChannelCategory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallChannelCategory";
import { IPageIShoppingMallChannelCategory } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallChannelCategory";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

export async function patch__shoppingMall_adminUser_channelCategories(props: {
  adminUser: AdminuserPayload;
  body: IShoppingMallChannelCategory.IRequest;
}): Promise<IPageIShoppingMallChannelCategory.ISummary> {
  const { body } = props;

  const page = body.page ?? 1;
  const limit = body.limit ?? 10;
  const skip = (page - 1) * limit;

  // Construct where clause inline to satisfy Prisma
  const where = {
    ...(body.shopping_mall_channel_id !== undefined &&
      body.shopping_mall_channel_id !== null && {
        shopping_mall_channel_id: body.shopping_mall_channel_id,
      }),
    ...(body.shopping_mall_category_id !== undefined &&
      body.shopping_mall_category_id !== null && {
        shopping_mall_category_id: body.shopping_mall_category_id,
      }),
    ...(body.deleted_at === true
      ? { deleted_at: { not: null } }
      : body.deleted_at === false
        ? { deleted_at: null }
        : {}),
    ...(body.search !== undefined &&
    body.search !== null &&
    body.search.length > 0
      ? {
          OR: [
            { channel: { code: { contains: body.search } } },
            { channel: { name: { contains: body.search } } },
            { category: { code: { contains: body.search } } },
            { category: { name: { contains: body.search } } },
          ],
        }
      : {}),
  };

  // Find many with correct include fields from Prisma schema
  const [results, total] = await Promise.all([
    MyGlobal.prisma.shopping_mall_channel_categories.findMany({
      where,
      include: {
        channel: true,
        category: true,
      },
      skip,
      take: limit,
      orderBy: { created_at: "desc" },
    }),
    MyGlobal.prisma.shopping_mall_channel_categories.count({ where }),
  ]);

  return {
    pagination: {
      current: Number(page),
      limit: Number(limit),
      records: total,
      pages: Math.ceil(total / limit),
    },
    data: results.map((r) => ({
      id: r.id,
      shopping_mall_channel_id: r.shopping_mall_channel_id,
      shopping_mall_category_id: r.shopping_mall_category_id,
    })),
  };
}
