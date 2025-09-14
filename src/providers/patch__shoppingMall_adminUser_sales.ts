import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSale } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSale";
import { IPageIShoppingMallSale } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallSale";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Retrieves a filtered and paginated list of sales products in the shopping
 * mall.
 *
 * This function supports filters including product status, channel ID, seller
 * user ID, section ID, and search text on product name or code. Pagination
 * supports page and limit with defaults of 1 and 20 respectively. Sorting is
 * supported via a sort string, defaulting to descending creation date. Only
 * sales not soft-deleted (deleted_at=null) are included.
 *
 * @param props - Object containing the authenticated adminUser and the search
 *   request body.
 * @param props.adminUser - Authenticated admin user payload.
 * @param props.body - Search criteria and pagination parameters for sales.
 * @returns A paginated summary of sales matching the filters.
 * @throws Error if database operations fail.
 */
export async function patch__shoppingMall_adminUser_sales(props: {
  adminUser: AdminuserPayload;
  body: IShoppingMallSale.IRequest;
}): Promise<IPageIShoppingMallSale.ISummary> {
  const { adminUser, body } = props;
  // Provide default pagination parameters
  const page: number = body.page ?? 1;
  const limit: number = body.limit ?? 20;

  // Constructing the Prisma where condition safely
  const where = {
    deleted_at: null,
    ...(body.status !== undefined &&
      body.status !== null && {
        status: body.status,
      }),
    ...(body.channel_id !== undefined &&
      body.channel_id !== null && {
        shopping_mall_channel_id: body.channel_id,
      }),
    ...(body.seller_user_id !== undefined &&
      body.seller_user_id !== null && {
        shopping_mall_seller_user_id: body.seller_user_id,
      }),
    ...(body.section_id !== undefined &&
      body.section_id !== null && {
        shopping_mall_section_id: body.section_id,
      }),
    ...(body.search !== undefined && body.search !== null
      ? {
          OR: [
            { name: { contains: body.search } },
            { code: { contains: body.search } },
          ],
        }
      : {}),
  };

  // Define orderBy inline, default to created_at DESC
  const orderBy: { [key: string]: "asc" | "desc" } =
    body.sort && body.sort.length > 0
      ? { [body.sort]: "asc" }
      : { created_at: "desc" };

  // Calculate skip for pagination
  const skip = (page - 1) * limit;

  // Perform database fetches concurrently
  const [results, total] = await Promise.all([
    MyGlobal.prisma.shopping_mall_sales.findMany({
      where,
      orderBy,
      skip,
      take: limit,
    }),
    MyGlobal.prisma.shopping_mall_sales.count({ where }),
  ]);

  // Map and convert date fields for the response
  return {
    pagination: {
      current: page,
      limit: limit,
      records: total,
      pages: Math.ceil(total / limit),
    },
    data: results.map((sale) => ({
      id: sale.id as string & tags.Format<"uuid">,
      shopping_mall_channel_id: sale.shopping_mall_channel_id as string &
        tags.Format<"uuid">,
      shopping_mall_section_id: sale.shopping_mall_section_id ?? null,
      shopping_mall_seller_user_id:
        sale.shopping_mall_seller_user_id as string & tags.Format<"uuid">,
      code: sale.code,
      status: sale.status,
      name: sale.name,
      price: sale.price,
      created_at: toISOStringSafe(sale.created_at),
      updated_at: toISOStringSafe(sale.updated_at),
    })),
  };
}
