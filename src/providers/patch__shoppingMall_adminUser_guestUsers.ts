import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallGuestUsers } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallGuestUsers";
import { IPageIShoppingMallGuestUsers } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallGuestUsers";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Search guest user sessions with filters and pagination
 *
 * This endpoint allows an admin user to retrieve filtered lists of guest user
 * sessions connected to the system, supporting free-text search, date range
 * filtering, and pagination.
 *
 * @param props - Object containing the adminUser authentication payload and
 *   request body
 * @param props.adminUser - The authenticated administrator user performing the
 *   search
 * @param props.body - Filter criteria following
 *   IShoppingMallGuestUsers.IRequest interface
 * @returns Paginated summary list conforming to
 *   IPageIShoppingMallGuestUsers.ISummary
 * @throws {Error} Throws error when database operations fail
 */
export async function patch__shoppingMall_adminUser_guestUsers(props: {
  adminUser: AdminuserPayload;
  body: IShoppingMallGuestUsers.IRequest;
}): Promise<IPageIShoppingMallGuestUsers.ISummary> {
  const { adminUser, body } = props;

  const page = body.page ?? 1;
  const limit = body.limit ?? 10;

  // Validate sortBy to allowed fields
  const allowedSortFields = [
    "id",
    "ip_address",
    "access_url",
    "user_agent",
    "session_start_at",
    "session_end_at",
    "created_at",
  ];

  const sortBy = allowedSortFields.includes(body.sortBy ?? "created_at")
    ? (body.sortBy ?? "created_at")
    : "created_at";

  const sortDirection = body.sortDirection === "asc" ? "asc" : "desc";

  // Build where condition
  const where: any = {
    deleted_at: null,
  };

  if (
    body.search !== undefined &&
    body.search !== null &&
    body.search.length > 0
  ) {
    where.OR = [
      { ip_address: { contains: body.search } },
      { access_url: { contains: body.search } },
      { user_agent: { contains: body.search } },
    ];
  }

  if (
    body.session_start_after !== undefined &&
    body.session_start_after !== null
  ) {
    where.session_start_at = {
      ...(where.session_start_at ?? {}),
      gte: body.session_start_after,
    };
  }

  if (
    body.session_start_before !== undefined &&
    body.session_start_before !== null
  ) {
    where.session_start_at = {
      ...(where.session_start_at ?? {}),
      lte: body.session_start_before,
    };
  }

  // Fetch data and total simultaneously
  const [results, total] = await Promise.all([
    MyGlobal.prisma.shopping_mall_guestusers.findMany({
      where,
      select: {
        id: true,
        ip_address: true,
        access_url: true,
        user_agent: true,
        session_start_at: true,
        session_end_at: true,
        created_at: true,
      },
      orderBy: { [sortBy]: sortDirection },
      skip: (page - 1) * limit,
      take: limit,
    }),
    MyGlobal.prisma.shopping_mall_guestusers.count({ where }),
  ]);

  return {
    pagination: {
      current: Number(page),
      limit: Number(limit),
      records: total,
      pages: Math.ceil(total / limit),
    },
    data: results.map((r) => ({
      id: r.id,
      ip_address: r.ip_address,
      access_url: r.access_url,
      user_agent: r.user_agent ?? null,
      session_start_at: r.session_start_at
        ? toISOStringSafe(r.session_start_at)
        : ("1970-01-01T00:00:00.000Z" as string & tags.Format<"date-time">),
      session_end_at: r.session_end_at
        ? toISOStringSafe(r.session_end_at)
        : null,
      created_at: toISOStringSafe(r.created_at),
    })),
  };
}
