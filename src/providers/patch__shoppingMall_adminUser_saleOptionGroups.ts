import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSaleOptionGroup } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleOptionGroup";
import { IPageIShoppingMallSaleOptionGroup } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallSaleOptionGroup";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

export async function patch__shoppingMall_adminUser_saleOptionGroups(props: {
  adminUser: AdminuserPayload;
  body: IShoppingMallSaleOptionGroup.IRequest;
}): Promise<IPageIShoppingMallSaleOptionGroup.ISummary> {
  const { body } = props;

  const page = body.page ?? 1;
  const limit = body.limit ?? 10;

  const where = {
    deleted_at: null,
    ...(body.search !== undefined && body.search !== null
      ? {
          OR: [
            { code: { contains: body.search } },
            { name: { contains: body.search } },
          ],
        }
      : {}),
  };

  // Prisma expects 'asc' | 'desc' literal for sort order
  const orderBy =
    body.orderBy === "code" || body.orderBy === "name"
      ? { [body.orderBy]: "asc" as const }
      : { created_at: "desc" as const };

  const [items, total] = await Promise.all([
    MyGlobal.prisma.shopping_mall_sale_option_groups.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        code: true,
        name: true,
      },
    }),
    MyGlobal.prisma.shopping_mall_sale_option_groups.count({
      where,
    }),
  ]);

  return {
    pagination: {
      current: Number(page),
      limit: Number(limit),
      records: total,
      pages: Math.ceil(total / limit),
    },
    data: items.map((item) => ({
      id: item.id,
      code: item.code,
      name: item.name,
    })),
  };
}
