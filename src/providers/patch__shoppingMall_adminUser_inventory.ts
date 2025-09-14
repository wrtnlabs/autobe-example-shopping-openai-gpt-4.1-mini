import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallInventory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallInventory";
import { IPageIShoppingMallInventory } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallInventory";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Retrieve a paginated list of inventory summaries filtered by specified
 * criteria.
 *
 * Supports filtering by sale ID, option combination code, and stock quantity
 * range. Handles pagination and sorting with default values.
 *
 * @param props - Object containing the authenticated adminUser and the search
 *   criteria body.
 * @param props.adminUser - The authenticated admin user making the request.
 * @param props.body - Search criteria and pagination parameters.
 * @returns A paginated summary list of inventory items.
 * @throws Error if the database query fails or parameters are invalid.
 */
export async function patch__shoppingMall_adminUser_inventory(props: {
  adminUser: AdminuserPayload;
  body: IShoppingMallInventory.IRequest;
}): Promise<IPageIShoppingMallInventory.ISummary> {
  const { body } = props;

  const page = body.page ?? 1;
  const limit = body.limit ?? 20;
  const skip = (page - 1) * limit;

  // Construct where clause with careful null/undefined checks
  const where = {
    deleted_at: null,
    ...(body.saleId !== undefined &&
      body.saleId !== null && { shopping_mall_sale_id: body.saleId }),
    ...(body.optionCombinationCode !== undefined &&
      body.optionCombinationCode !== null && {
        option_combination_code: { contains: body.optionCombinationCode },
      }),
    ...((body.minQuantity !== undefined && body.minQuantity !== null) ||
    (body.maxQuantity !== undefined && body.maxQuantity !== null)
      ? {
          stock_quantity: {
            ...(body.minQuantity !== undefined && body.minQuantity !== null
              ? { gte: body.minQuantity }
              : {}),
            ...(body.maxQuantity !== undefined && body.maxQuantity !== null
              ? { lte: body.maxQuantity }
              : {}),
          },
        }
      : {}),
  };

  // Validate orderBy field against allowed keys; default to created_at
  const allowedOrderByFields = new Set(["created_at", "stock_quantity"]);
  const orderByField =
    body.orderBy && allowedOrderByFields.has(body.orderBy)
      ? body.orderBy
      : "created_at";

  const [rows, total] = await Promise.all([
    MyGlobal.prisma.shopping_mall_inventory.findMany({
      where,
      skip,
      take: limit,
      orderBy: { [orderByField]: "desc" },
    }),
    MyGlobal.prisma.shopping_mall_inventory.count({ where }),
  ]);

  return {
    pagination: {
      current: page,
      limit: limit,
      records: total,
      pages: Math.ceil(total / limit),
    },
    data: rows.map((item) => ({
      id: item.id,
      shopping_mall_sale_id: item.shopping_mall_sale_id,
      option_combination_code: item.option_combination_code,
      stock_quantity: item.stock_quantity,
    })),
  };
}
