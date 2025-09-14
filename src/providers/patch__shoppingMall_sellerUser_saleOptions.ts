import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSaleOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleOption";
import { IPageIShoppingMallSaleOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallSaleOption";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

export async function patch__shoppingMall_sellerUser_saleOptions(props: {
  sellerUser: SelleruserPayload;
  body: IShoppingMallSaleOption.IRequest;
}): Promise<IPageIShoppingMallSaleOption.ISummary> {
  const { body } = props;

  const page = body.page ?? 1;
  const limit = body.limit ?? 10;
  const skip = (page - 1) * limit;

  // Parse orderBy string to Prisma orderBy
  let orderBy: { [key: string]: "asc" | "desc" } = { created_at: "desc" };
  if (body.orderBy) {
    const trimmed = body.orderBy.trim();
    const descending = trimmed.startsWith("-");
    const field = descending ? trimmed.slice(1) : trimmed;
    orderBy = { [field]: descending ? "desc" : "asc" };
  }

  // Build where clause with soft delete filter and optional search filter
  const where: {
    deleted_at: null;
    OR?: {
      code?: { contains: string };
      name?: { contains: string };
      type?: { contains: string };
    }[];
  } = { deleted_at: null };

  if (body.search !== undefined && body.search !== null) {
    where.OR = [
      { code: { contains: body.search } },
      { name: { contains: body.search } },
      { type: { contains: body.search } },
    ];
  }

  // Fetch data and total count concurrently
  const [results, total] = await Promise.all([
    MyGlobal.prisma.shopping_mall_sale_options.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      select: {
        id: true,
        shopping_mall_sale_option_group_id: true,
        code: true,
        name: true,
        type: true,
        created_at: true,
        updated_at: true,
      },
    }),
    MyGlobal.prisma.shopping_mall_sale_options.count({ where }),
  ]);

  // Prepare and return paginated summary
  return {
    pagination: {
      current: Number(page),
      limit: Number(limit),
      records: total,
      pages: Math.ceil(total / limit),
    },
    data: results.map((item) => ({
      id: item.id,
      shopping_mall_sale_option_group_id:
        item.shopping_mall_sale_option_group_id,
      code: item.code,
      name: item.name,
      type: item.type,
      created_at: toISOStringSafe(item.created_at),
      updated_at: toISOStringSafe(item.updated_at),
    })),
  };
}
