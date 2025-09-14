import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSaleUnitOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleUnitOption";
import { IPageIShoppingMallSaleUnitOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallSaleUnitOption";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * List sale unit options for a specific sale unit
 *
 * This endpoint fetches a paginated list of sale unit options associated with
 * the specified sale unit under the given sale product. It supports filtering
 * by saleOptionId, pagination, and sorting options.
 *
 * Only authorized admin users can access this data.
 *
 * @param props - Object containing adminUser, saleId, saleUnitId, and
 *   filtering/pagination body
 * @param props.adminUser - Authenticated admin user performing the request
 * @param props.saleId - UUID of the sale product
 * @param props.saleUnitId - UUID of the specific sale unit
 * @param props.body - Filtering and pagination parameters
 * @returns Paginated list of sale unit option summaries
 * @throws Error when any runtime or database operation fails
 */
export async function patch__shoppingMall_adminUser_sales_$saleId_saleUnits_$saleUnitId_saleUnitOptions(props: {
  adminUser: AdminuserPayload;
  saleId: string & tags.Format<"uuid">;
  saleUnitId: string & tags.Format<"uuid">;
  body: IShoppingMallSaleUnitOption.IRequest;
}): Promise<IPageIShoppingMallSaleUnitOption.ISummary> {
  const { adminUser, saleId, saleUnitId, body } = props;

  const page = body.page ?? 1;
  const limit = body.limit ?? 20;
  const skip = (page - 1) * limit;

  const whereCondition = {
    shopping_mall_sale_unit_id: saleUnitId,
    deleted_at: null,
    ...(body.saleOptionId !== undefined &&
      body.saleOptionId !== null && {
        shopping_mall_sale_option_id: body.saleOptionId,
      }),
  };

  const total = await MyGlobal.prisma.shopping_mall_sale_unit_options.count({
    where: whereCondition,
  });

  const results =
    await MyGlobal.prisma.shopping_mall_sale_unit_options.findMany({
      where: whereCondition,
      select: {
        id: true,
        shopping_mall_sale_unit_id: true,
        shopping_mall_sale_option_id: true,
        additional_price: true,
        stock_quantity: true,
        created_at: true,
        updated_at: true,
      },
      orderBy: body.sort ? { [body.sort]: "asc" } : { created_at: "desc" },
      skip: skip,
      take: limit,
    });

  const data = results.map((item) => ({
    id: item.id,
    shopping_mall_sale_unit_id: item.shopping_mall_sale_unit_id,
    shopping_mall_sale_option_id: item.shopping_mall_sale_option_id,
    additional_price: item.additional_price,
    stock_quantity: item.stock_quantity,
    created_at: toISOStringSafe(item.created_at),
    updated_at: toISOStringSafe(item.updated_at),
  }));

  return {
    pagination: {
      current: Number(page),
      limit: Number(limit),
      records: total,
      pages: Math.ceil(total / limit),
    },
    data: data,
  };
}
