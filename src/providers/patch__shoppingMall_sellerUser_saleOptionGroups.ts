import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSaleOptionGroup } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleOptionGroup";
import { IPageIShoppingMallSaleOptionGroup } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallSaleOptionGroup";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

export async function patch__shoppingMall_sellerUser_saleOptionGroups(props: {
  sellerUser: SelleruserPayload;
  body: IShoppingMallSaleOptionGroup.IRequest;
}): Promise<IPageIShoppingMallSaleOptionGroup.ISummary> {
  const { search, page, limit, orderBy } = props.body;

  const where = {
    deleted_at: null,
    ...(search !== undefined &&
      search !== null && {
        OR: [{ code: { contains: search } }, { name: { contains: search } }],
      }),
  };

  const [orderField, orderDirectionRaw] = orderBy ? orderBy.split(" ") : [];
  const orderDirection = orderDirectionRaw?.toUpperCase();

  const orderByCondition =
    orderField &&
    orderDirection &&
    ["code", "name"].includes(orderField) &&
    ["ASC", "DESC"].includes(orderDirection)
      ? { [orderField]: orderDirection.toLowerCase() as "asc" | "desc" }
      : ({ created_at: "desc" } as const);

  const currentPage = page ?? 1;
  const perPage = limit ?? 10;
  const skip = (currentPage - 1) * perPage;

  const [results, total] = await Promise.all([
    MyGlobal.prisma.shopping_mall_sale_option_groups.findMany({
      where,
      orderBy: orderByCondition,
      skip,
      take: perPage,
      select: {
        id: true,
        code: true,
        name: true,
      },
    }),
    MyGlobal.prisma.shopping_mall_sale_option_groups.count({ where }),
  ]);

  return {
    pagination: {
      current: Number(currentPage),
      limit: Number(perPage),
      records: total,
      pages: Math.ceil(total / perPage),
    },
    data: results.map((item) => ({
      id: item.id,
      code: item.code,
      name: item.name,
    })),
  };
}
