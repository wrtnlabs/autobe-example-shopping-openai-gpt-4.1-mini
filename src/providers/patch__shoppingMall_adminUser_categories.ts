import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallCategory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCategory";
import { IPageIShoppingMallCategory } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallCategory";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Search product categories with filters and pagination
 *
 * This operation fetches paginated shopping mall product categories filtered by
 * optional status and search criteria (code or name).
 *
 * Authorization is enforced by adminUser role (passed via props.adminUser).
 *
 * @param props - Object containing adminUser authentication payload and filter
 *   parameters
 * @param props.adminUser - Authenticated admin user making the request
 * @param props.body - Search filter and pagination parameters
 * @returns Paginated summary of product categories matching filters
 * @throws {Error} If database queries fail
 */
export async function patch__shoppingMall_adminUser_categories(props: {
  adminUser: AdminuserPayload;
  body: IShoppingMallCategory.IRequest;
}): Promise<IPageIShoppingMallCategory.ISummary> {
  const { adminUser, body } = props;

  const page = body.page ?? 0;
  const limit = body.limit ?? 20;

  const whereCondition = {
    ...(body.status === "deleted"
      ? { deleted_at: { not: null } }
      : { deleted_at: null }),
    ...(body.status !== undefined &&
    body.status !== null &&
    body.status !== "deleted"
      ? { status: body.status }
      : {}),
    ...(body.search !== undefined &&
    body.search !== null &&
    body.search.length > 0
      ? {
          OR: [
            { code: { contains: body.search } },
            { name: { contains: body.search } },
          ],
        }
      : {}),
  };

  const [results, total] = await Promise.all([
    MyGlobal.prisma.shopping_mall_categories.findMany({
      where: whereCondition,
      skip: page * limit,
      take: limit,
      orderBy: { created_at: "desc" },
      select: {
        id: true,
        code: true,
        name: true,
        status: true,
      },
    }),
    MyGlobal.prisma.shopping_mall_categories.count({ where: whereCondition }),
  ]);

  return {
    pagination: {
      current: Number(page),
      limit: Number(limit),
      records: total,
      pages: Math.ceil(total / limit),
    },
    data: results.map((category) => ({
      id: category.id,
      code: category.code,
      name: category.name,
      status: category.status,
    })),
  };
}
