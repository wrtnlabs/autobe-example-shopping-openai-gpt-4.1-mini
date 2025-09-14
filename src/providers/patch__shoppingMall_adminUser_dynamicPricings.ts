import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallDynamicPricing } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallDynamicPricing";
import { IPageIShoppingMallDynamicPricing } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallDynamicPricing";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Searches and retrieves a paginated list of AI-controlled dynamic pricing
 * records applied to shopping mall products. Supports filtering by status,
 * effective date range, pricing rule, ordering, and pagination.
 *
 * Only accessible to authorized administrative users.
 *
 * @param props - Object containing adminUser payload and filter criteria
 * @param props.adminUser - Authenticated admin user payload
 * @param props.body - Filter and pagination parameters
 * @returns Paginated summary of dynamic pricing records matching filters
 * @throws {Error} When filtering or database errors occur
 */
export async function patch__shoppingMall_adminUser_dynamicPricings(props: {
  adminUser: AdminuserPayload;
  body: IShoppingMallDynamicPricing.IRequest;
}): Promise<IPageIShoppingMallDynamicPricing.ISummary> {
  const { body } = props;

  // Build filter conditions for Prisma query
  const where = {
    deleted_at: null,
    ...(body.status !== undefined &&
      body.status !== null && { status: body.status }),
    ...((body.effective_from !== undefined && body.effective_from !== null) ||
    (body.effective_to !== undefined && body.effective_to !== null)
      ? {
          effective_from: {
            ...(body.effective_from !== undefined &&
              body.effective_from !== null && { gte: body.effective_from }),
            ...(body.effective_to !== undefined &&
              body.effective_to !== null && { lte: body.effective_to }),
          },
        }
      : {}),
    ...(body.pricing_rule_id !== undefined &&
      body.pricing_rule_id !== null && {
        pricing_rule_id: body.pricing_rule_id,
      }),
  };

  // Pagination with defaults
  const page =
    body.page !== undefined && body.page !== null && body.page >= 0
      ? body.page
      : 0;
  const limit =
    body.limit !== undefined && body.limit !== null && body.limit > 0
      ? body.limit
      : 10;
  const skip = page * limit;

  // Sorting with defaults
  const orderBy =
    body.orderBy && typeof body.orderBy === "string"
      ? body.orderBy
      : "effective_from";
  const orderDirection =
    body.orderDirection && typeof body.orderDirection === "string"
      ? body.orderDirection.toLowerCase()
      : "desc";

  // Execute queries in parallel
  const [total, rows] = await Promise.all([
    MyGlobal.prisma.shopping_mall_dynamic_pricing.count({ where }),
    MyGlobal.prisma.shopping_mall_dynamic_pricing.findMany({
      where,
      orderBy: { [orderBy]: orderDirection === "asc" ? "asc" : "desc" },
      skip,
      take: limit,
    }),
  ]);

  // Map results to summary type and format dates properly
  return {
    pagination: {
      current: Number(page),
      limit: Number(limit),
      records: total,
      pages: Math.ceil(total / limit),
    },
    data: rows.map((row) => ({
      id: row.id,
      product_id: row.product_id,
      adjusted_price: row.adjusted_price,
      status: row.status,
      effective_from: toISOStringSafe(row.effective_from),
    })),
  };
}
