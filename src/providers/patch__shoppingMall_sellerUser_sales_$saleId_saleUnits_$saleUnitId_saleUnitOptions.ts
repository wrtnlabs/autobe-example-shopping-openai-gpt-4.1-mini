import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSaleUnitOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleUnitOption";
import { IPageIShoppingMallSaleUnitOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallSaleUnitOption";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

export async function patch__shoppingMall_sellerUser_sales_$saleId_saleUnits_$saleUnitId_saleUnitOptions(props: {
  sellerUser: SelleruserPayload;
  saleId: string & tags.Format<"uuid">;
  saleUnitId: string & tags.Format<"uuid">;
  body: IShoppingMallSaleUnitOption.IRequest;
}): Promise<IPageIShoppingMallSaleUnitOption.ISummary> {
  const { sellerUser, saleId, saleUnitId, body } = props;

  const sale = await MyGlobal.prisma.shopping_mall_sales.findFirst({
    where: {
      id: saleId,
      shopping_mall_seller_user_id: sellerUser.id,
      deleted_at: null,
    },
  });

  if (!sale) throw new Error("Sale product not found or unauthorized");

  const saleUnit = await MyGlobal.prisma.shopping_mall_sale_units.findFirst({
    where: {
      id: saleUnitId,
      shopping_mall_sale_id: saleId,
      deleted_at: null,
    },
  });

  if (!saleUnit) throw new Error("Sale unit not found in sale product");

  const whereCondition: {
    shopping_mall_sale_unit_id: string & tags.Format<"uuid">;
    deleted_at: null;
    shopping_mall_sale_option_id?: string & tags.Format<"uuid">;
    saleOption?: {
      OR: ({ code: { contains: string } } | { name: { contains: string } })[];
      deleted_at: null;
    };
  } = {
    shopping_mall_sale_unit_id: saleUnitId,
    deleted_at: null,
    ...(body.saleOptionId !== undefined &&
      body.saleOptionId !== null && {
        shopping_mall_sale_option_id: body.saleOptionId,
      }),
  };

  if (
    body.filter !== undefined &&
    body.filter !== null &&
    body.filter.trim() !== ""
  ) {
    whereCondition.saleOption = {
      OR: [
        { code: { contains: body.filter } },
        { name: { contains: body.filter } },
      ],
      deleted_at: null,
    };
  }

  const page = body.page && body.page >= 1 ? body.page : 1;
  const limit = body.limit && body.limit >= 1 ? body.limit : 10;
  const skip = (page - 1) * limit;

  const validSortKeys = [
    "created_at",
    "updated_at",
    "additional_price",
    "stock_quantity",
  ];

  const orderByCondition =
    body.sort && validSortKeys.includes(body.sort)
      ? { [body.sort]: "asc" as const }
      : { created_at: "desc" as const };

  const [results, total] = await Promise.all([
    MyGlobal.prisma.shopping_mall_sale_unit_options.findMany({
      where: whereCondition,
      include: { saleOption: true },
      orderBy: orderByCondition,
      skip,
      take: limit,
    }),

    MyGlobal.prisma.shopping_mall_sale_unit_options.count({
      where: whereCondition,
    }),
  ]);

  const data: IShoppingMallSaleUnitOption.ISummary[] = results.map((r) => ({
    id: r.id,
    shopping_mall_sale_unit_id: r.shopping_mall_sale_unit_id,
    shopping_mall_sale_option_id: r.shopping_mall_sale_option_id,
    additional_price: r.additional_price,
    stock_quantity: r.stock_quantity,
    created_at: toISOStringSafe(r.created_at),
    updated_at: toISOStringSafe(r.updated_at),
  }));

  return {
    pagination: {
      current: Number(page),
      limit: Number(limit),
      records: total,
      pages: Math.ceil(total / limit),
    },
    data,
  };
}
