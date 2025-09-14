import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSection } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSection";
import { IPageIShoppingMallSection } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallSection";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Retrieve a paginated list of shopping mall spatial sections.
 *
 * Allows filtering by status and search keyword (in code or name), with
 * pagination and sorting capabilities.
 *
 * Access restricted to authenticated admin users.
 *
 * @param props - Object containing the authenticated adminUser and request body
 *   for filters
 * @param props.adminUser - Authenticated admin user payload
 * @param props.body - Request parameters for filtering, searching, and
 *   pagination
 * @returns A paginated summary list of shopping mall sections
 * @throws {Error} If any unexpected error occurs during data retrieval
 */
export async function patch__shoppingMall_adminUser_sections(props: {
  adminUser: AdminuserPayload;
  body: IShoppingMallSection.IRequest;
}): Promise<IPageIShoppingMallSection.ISummary> {
  const { body } = props;

  // Set default for page and limit
  const page = body.page ?? 1;
  const limit = body.limit ?? 10;

  // Validate sort field to allowed values to prevent runtime errors
  const allowedSortFields = ["code", "name", "created_at", "updated_at"];
  const sortField =
    body.sort && allowedSortFields.includes(body.sort)
      ? body.sort
      : "created_at";

  // Build where condition for filters
  const where: any = {
    deleted_at: null,
  };

  if (body.status !== undefined && body.status !== null) {
    where.status = body.status;
  }

  if (body.search !== undefined && body.search !== null) {
    where.OR = [
      { code: { contains: body.search } },
      { name: { contains: body.search } },
    ];
  }

  // Define orderBy inline
  const orderBy = { [sortField]: "asc" };

  // Query data and total count concurrently
  const [results, total] = await Promise.all([
    MyGlobal.prisma.shopping_mall_sections.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    MyGlobal.prisma.shopping_mall_sections.count({ where }),
  ]);

  // Map results converting Dates to ISO strings with branding
  return {
    pagination: {
      current: Number(page),
      limit: Number(limit),
      records: total,
      pages: Math.ceil(total / limit),
    },
    data: results.map((section) => ({
      id: section.id,
      code: section.code,
      name: section.name,
      description: section.description,
      status: section.status,
      created_at: toISOStringSafe(section.created_at),
    })),
  };
}
