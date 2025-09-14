import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSaleSnapshot } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleSnapshot";
import { IPageIShoppingMallSaleSnapshot } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallSaleSnapshot";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * List paginated snapshots of a shopping mall sale product
 *
 * Retrieves a paginated list of snapshots for the specified sale product,
 * applying optional filters such as search text, date ranges, statuses, and
 * price ranges.
 *
 * @param props - Object containing admin user, saleId, and request body with
 *   filter and pagination
 * @param props.adminUser - The authenticated admin user performing the
 *   operation
 * @param props.saleId - UUID of the target sale product
 * @param props.body - Request body containing pagination and filter criteria
 * @returns Paginated summary list of sale snapshots matching the filter
 *   criteria
 * @throws {Error} When underlying database operations fail or parameters are
 *   invalid
 */
export async function patch__shoppingMall_adminUser_sales_$saleId_snapshots(props: {
  adminUser: AdminuserPayload;
  saleId: string & tags.Format<"uuid">;
  body: IShoppingMallSaleSnapshot.IRequest;
}): Promise<IPageIShoppingMallSaleSnapshot.ISummary> {
  const { adminUser, saleId, body } = props;

  const page = body.page ?? 1;
  const limit = body.limit ?? 20;

  const where: {
    shopping_mall_sale_id: string & tags.Format<"uuid">;
    OR?: {
      code?: { contains: string } | undefined;
      name?: { contains: string } | undefined;
      description?: { contains: string } | undefined;
    }[];
    created_at?: {
      gte?: string & tags.Format<"date-time">;
      lte?: string & tags.Format<"date-time">;
    };
    status?: { in: string[] };
    price?: { gte?: number; lte?: number };
  } = {
    shopping_mall_sale_id: saleId,
  };

  if (body.filter) {
    if (body.filter.searchText) {
      const searchText = body.filter.searchText;
      where.OR = [
        { code: { contains: searchText } },
        { name: { contains: searchText } },
        { description: { contains: searchText } },
      ];
    }
    if (body.filter.createdAfter) {
      where.created_at = { gte: body.filter.createdAfter };
    }
    if (body.filter.createdBefore) {
      where.created_at = where.created_at || {};
      where.created_at.lte = body.filter.createdBefore;
    }
    if (body.filter.statuses && body.filter.statuses.length > 0) {
      where.status = { in: body.filter.statuses };
    }
    if (body.filter.minPrice !== undefined && body.filter.minPrice !== null) {
      where.price = { gte: body.filter.minPrice };
    }
    if (body.filter.maxPrice !== undefined && body.filter.maxPrice !== null) {
      where.price = where.price || {};
      where.price.lte = body.filter.maxPrice;
    }
  }

  const [results, total] = await Promise.all([
    MyGlobal.prisma.shopping_mall_sale_snapshots.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { created_at: "desc" },
    }),
    MyGlobal.prisma.shopping_mall_sale_snapshots.count({ where }),
  ]);

  return {
    pagination: {
      current: Number(page),
      limit: Number(limit),
      records: total,
      pages: Math.ceil(total / limit),
    },
    data: results.map((item) => ({
      id: item.id,
      shopping_mall_sale_id: item.shopping_mall_sale_id,
      code: item.code,
      status: item.status,
      name: item.name,
      description: item.description ?? null,
      price: item.price,
      created_at: toISOStringSafe(item.created_at),
    })),
  };
}
