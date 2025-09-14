import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallInventory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallInventory";
import { IPageIShoppingMallInventory } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallInventory";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

export async function patch__shoppingMall_sellerUser_inventory(props: {
  sellerUser: SelleruserPayload;
  body: IShoppingMallInventory.IRequest;
}): Promise<IPageIShoppingMallInventory.ISummary> {
  const { sellerUser, body } = props;

  if (!body.saleId) {
    return {
      pagination: {
        current: 1 as number & tags.Type<"int32"> & tags.Minimum<0>,
        limit: 20 as number & tags.Type<"int32"> & tags.Minimum<0>,
        records: 0 as number & tags.Type<"int32"> & tags.Minimum<0>,
        pages: 0 as number & tags.Type<"int32"> & tags.Minimum<0>,
      },
      data: [],
    };
  }

  const sale = await MyGlobal.prisma.shopping_mall_sales.findUnique({
    where: { id: body.saleId },
    select: { shopping_mall_seller_user_id: true },
  });

  if (!sale || sale.shopping_mall_seller_user_id !== sellerUser.id) {
    throw new Error("Unauthorized: You have no access to this sale inventory");
  }

  const page = body.page && body.page > 0 ? body.page : 1;
  const limit = body.limit && body.limit > 0 ? body.limit : 20;

  const whereConditions: {
    deleted_at: null;
    shopping_mall_sale_id: string & tags.Format<"uuid">;
    option_combination_code?: { contains: string };
    stock_quantity?: { gte?: number; lte?: number };
  } = {
    deleted_at: null,
    shopping_mall_sale_id: body.saleId,
  };

  if (
    body.optionCombinationCode !== undefined &&
    body.optionCombinationCode !== null
  ) {
    whereConditions.option_combination_code = {
      contains: body.optionCombinationCode,
    };
  }

  if (body.minQuantity !== undefined && body.minQuantity !== null) {
    whereConditions.stock_quantity = {
      ...whereConditions.stock_quantity,
      gte: body.minQuantity,
    };
  }

  if (body.maxQuantity !== undefined && body.maxQuantity !== null) {
    whereConditions.stock_quantity = {
      ...whereConditions.stock_quantity,
      lte: body.maxQuantity,
    };
  }

  const total = await MyGlobal.prisma.shopping_mall_inventory.count({
    where: whereConditions,
  });

  const validOrderBy =
    body.orderBy === "created_at" || body.orderBy === "stock_quantity"
      ? body.orderBy
      : "created_at";

  const rows = await MyGlobal.prisma.shopping_mall_inventory.findMany({
    where: whereConditions,
    orderBy: { [validOrderBy]: "desc" },
    skip: (page - 1) * limit,
    take: limit,
  });

  return {
    pagination: {
      current: Number(page),
      limit: Number(limit),
      records: total,
      pages: Math.ceil(total / limit),
    },
    data: rows.map((row) => ({
      id: row.id,
      shopping_mall_sale_id: row.shopping_mall_sale_id,
      option_combination_code: row.option_combination_code,
      stock_quantity: row.stock_quantity,
    })),
  };
}
