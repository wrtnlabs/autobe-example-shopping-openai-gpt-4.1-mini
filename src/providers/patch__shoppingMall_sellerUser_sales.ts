import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSale } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSale";
import { IPageIShoppingMallSale } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallSale";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

export async function patch__shoppingMall_sellerUser_sales(props: {
  sellerUser: SelleruserPayload;
  body: IShoppingMallSale.IRequest;
}): Promise<IPageIShoppingMallSale.ISummary> {
  const { sellerUser, body } = props;
  const page = body.page ?? 1;
  const limit = body.limit ?? 10;

  const where = {
    deleted_at: null,
    shopping_mall_seller_user_id: sellerUser.id,
    ...(body.status !== undefined &&
      body.status !== null && { status: body.status }),
    ...(body.channel_id !== undefined &&
      body.channel_id !== null && {
        shopping_mall_channel_id: body.channel_id,
      }),
    ...(body.section_id !== undefined &&
      body.section_id !== null && {
        shopping_mall_section_id: body.section_id,
      }),
    ...(body.search !== undefined &&
      body.search !== null && {
        OR: [
          { name: { contains: body.search } },
          { code: { contains: body.search } },
        ],
      }),
  };

  const [results, total] = await Promise.all([
    MyGlobal.prisma.shopping_mall_sales.findMany({
      where,
      orderBy:
        body.sort !== undefined && body.sort !== null && body.sort.length > 0
          ? { [body.sort]: "asc" as const }
          : { created_at: "desc" as const },
      skip: (page - 1) * limit,
      take: limit,
    }),
    MyGlobal.prisma.shopping_mall_sales.count({ where }),
  ]);

  const mappedResults = results.map((item) => ({
    id: item.id,
    shopping_mall_channel_id: item.shopping_mall_channel_id,
    shopping_mall_section_id: item.shopping_mall_section_id ?? null,
    shopping_mall_seller_user_id: item.shopping_mall_seller_user_id,
    code: item.code,
    status: item.status,
    name: item.name,
    price: item.price,
    created_at: toISOStringSafe(item.created_at),
    updated_at: toISOStringSafe(item.updated_at),
  }));

  return {
    pagination: {
      current: Number(page),
      limit: Number(limit),
      pages: Math.ceil(total / limit),
      records: total,
    },
    data: mappedResults,
  };
}
