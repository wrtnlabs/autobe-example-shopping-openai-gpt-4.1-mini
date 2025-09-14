import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSaleUnit } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleUnit";
import { IPageIShoppingMallSaleUnit } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallSaleUnit";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * List sale units for a specific sale product
 *
 * Retrieves a paginated, filtered list of sale units belonging to a specific
 * shopping mall sale product identified by `saleId`. Sale units represent
 * product components crucial for product composition, inventory, and
 * configuration management.
 *
 * Only accessible by authenticated admin users.
 *
 * @param props - Object containing adminUser payload, saleId, and
 *   filter/pagination body
 * @param props.adminUser - Authenticated admin user payload
 * @param props.saleId - UUID string identifying the sale product
 * @param props.body - Request body containing pagination and filtering criteria
 * @returns Paginated summary list of sale units matching the filters
 * @throws Error if underlying database operations fail
 */
export async function patch__shoppingMall_adminUser_sales_$saleId_saleUnits(props: {
  adminUser: AdminuserPayload;
  saleId: string & tags.Format<"uuid">;
  body: IShoppingMallSaleUnit.IRequest;
}): Promise<IPageIShoppingMallSaleUnit.ISummary> {
  const { saleId, body } = props;
  // Pagination defaults and normalization
  const page = body.page && body.page > 0 ? body.page : 1;
  const limit = body.limit && body.limit > 0 ? body.limit : 10;

  // Validate sortBy against allowed fields
  const allowedSortFields = new Set([
    "code",
    "name",
    "created_at",
    "updated_at",
  ]);
  const sortBy =
    body.sortBy && allowedSortFields.has(body.sortBy)
      ? body.sortBy
      : "created_at";

  // Validate order
  const order = body.order === "asc" ? "asc" : "desc";

  // Build Prisma where clause
  const where = {
    shopping_mall_sale_id: saleId,
    deleted_at: null,
    ...(body.search !== undefined && body.search !== null
      ? {
          OR: [
            { code: { contains: body.search } },
            { name: { contains: body.search } },
            { description: { contains: body.search } },
          ],
        }
      : {}),
  };

  // Query results and total count concurrently
  const [results, total] = await Promise.all([
    MyGlobal.prisma.shopping_mall_sale_units.findMany({
      where,
      orderBy: { [sortBy]: order },
      skip: (page - 1) * limit,
      take: limit,
    }),
    MyGlobal.prisma.shopping_mall_sale_units.count({ where }),
  ]);

  // Return data with converted date formats
  return {
    pagination: {
      current: Number(page),
      limit: Number(limit),
      records: total,
      pages: Math.ceil(total / limit),
    },
    data: results.map((unit) => ({
      id: unit.id,
      shopping_mall_sale_id: unit.shopping_mall_sale_id,
      code: unit.code,
      name: unit.name,
      description: unit.description ?? null,
      created_at: toISOStringSafe(unit.created_at),
      updated_at: toISOStringSafe(unit.updated_at),
    })),
  };
}
