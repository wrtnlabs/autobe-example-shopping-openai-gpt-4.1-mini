import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSaleSnapshot } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleSnapshot";
import { IPageIShoppingMallSaleSnapshot } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallSaleSnapshot";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

/**
 * Retrieves a paginated list of snapshots for a specified shopping mall sale
 * product.
 *
 * This function verifies the seller user ownership of the sale product and
 * fetches the sale snapshots with support for filtering, pagination, and
 * sorting.
 *
 * @param props - Object containing seller user, sale ID, and filtering
 *   parameters
 * @param props.sellerUser - The authenticated seller user making the request
 * @param props.saleId - Unique identifier of the sale product
 * @param props.body - Request body containing pagination and filter parameters
 * @returns Paginated summary list of sale snapshots
 * @throws Error if the sale product does not exist or is not owned by the
 *   seller
 */
export async function patch__shoppingMall_sellerUser_sales_$saleId_snapshots(props: {
  sellerUser: SelleruserPayload;
  saleId: string & tags.Format<"uuid">;
  body: IShoppingMallSaleSnapshot.IRequest;
}): Promise<IPageIShoppingMallSaleSnapshot.ISummary> {
  const { sellerUser, saleId, body } = props;

  const sale = await MyGlobal.prisma.shopping_mall_sales.findUnique({
    where: { id: saleId },
    select: { shopping_mall_seller_user_id: true },
  });

  if (!sale || sale.shopping_mall_seller_user_id !== sellerUser.id) {
    throw new Error(
      "Unauthorized: Sale product not found or not owned by seller",
    );
  }

  const page = body.page ?? 1;
  const limit = body.limit ?? 10;
  const skip = (page - 1) * limit;

  const where: any = { shopping_mall_sale_id: saleId };

  if (
    body.filter?.searchText !== undefined &&
    body.filter?.searchText !== null
  ) {
    where.OR = [
      { name: { contains: body.filter.searchText } },
      { code: { contains: body.filter.searchText } },
    ];
  }

  if (body.filter?.statuses !== undefined && body.filter?.statuses !== null) {
    where.status = { in: body.filter.statuses };
  }

  if (
    (body.filter?.createdAfter !== undefined &&
      body.filter.createdAfter !== null) ||
    (body.filter?.createdBefore !== undefined &&
      body.filter.createdBefore !== null)
  ) {
    where.created_at = {};
    if (
      body.filter?.createdAfter !== undefined &&
      body.filter.createdAfter !== null
    ) {
      where.created_at.gte = body.filter.createdAfter;
    }
    if (
      body.filter?.createdBefore !== undefined &&
      body.filter.createdBefore !== null
    ) {
      where.created_at.lte = body.filter.createdBefore;
    }
  }

  if (
    (body.filter?.minPrice !== undefined && body.filter.minPrice !== null) ||
    (body.filter?.maxPrice !== undefined && body.filter.maxPrice !== null)
  ) {
    where.price = {};
    if (body.filter?.minPrice !== undefined && body.filter.minPrice !== null) {
      where.price.gte = body.filter.minPrice;
    }
    if (body.filter?.maxPrice !== undefined && body.filter.maxPrice !== null) {
      where.price.lte = body.filter.maxPrice;
    }
  }

  const [records, total] = await Promise.all([
    MyGlobal.prisma.shopping_mall_sale_snapshots.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip,
      take: limit,
    }),
    MyGlobal.prisma.shopping_mall_sale_snapshots.count({ where }),
  ]);

  const data = records.map((record) => ({
    id: record.id,
    shopping_mall_sale_id: record.shopping_mall_sale_id,
    code: record.code,
    status: record.status,
    name: record.name,
    description: record.description === null ? null : record.description,
    price: record.price,
    created_at: toISOStringSafe(record.created_at),
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
