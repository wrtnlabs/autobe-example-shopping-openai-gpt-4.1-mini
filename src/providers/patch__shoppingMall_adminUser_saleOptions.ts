import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSaleOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleOption";
import { IPageIShoppingMallSaleOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallSaleOption";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Search and list sale options
 *
 * This operation searches and retrieves a filtered, paginated list of sale
 * options. It acts on the shopping_mall_sale_options table which contains all
 * possible sale options.
 *
 * The operation supports advanced search criteria and pagination controls for
 * effective querying. It provides summaries optimized for list displays.
 *
 * Authorization: Accessible only to sellerUser and adminUser roles.
 *
 * @param props - The request properties including the authenticated adminUser
 *   and the search request body.
 * @param props.adminUser - The authenticated admin user payload making the
 *   request.
 * @param props.body - The search criteria and pagination parameters for sale
 *   options.
 * @returns A paginated list of sale option summaries matching the search and
 *   pagination criteria.
 * @throws {Error} Throws if there are any issues during database access.
 */
export async function patch__shoppingMall_adminUser_saleOptions(props: {
  adminUser: AdminuserPayload;
  body: IShoppingMallSaleOption.IRequest;
}): Promise<IPageIShoppingMallSaleOption.ISummary> {
  const { adminUser, body } = props;
  const page = body.page ?? 1;
  const limit = body.limit ?? 10;

  const whereConditions = {
    deleted_at: null,
    ...(body.search !== undefined && body.search !== null
      ? {
          OR: [
            { code: { contains: body.search } },
            { name: { contains: body.search } },
            { type: { contains: body.search } },
          ],
        }
      : {}),
  };

  const [rows, total] = await Promise.all([
    MyGlobal.prisma.shopping_mall_sale_options.findMany({
      where: whereConditions,
      orderBy: body.orderBy
        ? { [body.orderBy]: "asc" }
        : { created_at: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    MyGlobal.prisma.shopping_mall_sale_options.count({
      where: whereConditions,
    }),
  ]);

  return {
    pagination: {
      current: Number(page),
      limit: Number(limit),
      records: total,
      pages: Math.max(Math.ceil(total / limit), 1),
    },
    data: rows.map((row) => ({
      id: row.id,
      shopping_mall_sale_option_group_id:
        row.shopping_mall_sale_option_group_id,
      code: row.code,
      name: row.name,
      type: row.type,
      created_at: toISOStringSafe(row.created_at),
      updated_at: toISOStringSafe(row.updated_at),
    })),
  };
}
