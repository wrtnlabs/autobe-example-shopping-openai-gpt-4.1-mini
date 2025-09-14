import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallFavoriteAddress } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallFavoriteAddress";
import { IPageIShoppingMallFavoriteAddress } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallFavoriteAddress";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Search favorite addresses with pagination and filters.
 *
 * Retrieves a paginated list of favorite shipping addresses for the
 * authenticated member user. Supports filtering by creation date ranges and
 * sorting. Ensures only the authorized member user can view their favorites.
 *
 * @param props - Object containing authenticated user and filter criteria
 * @param props.memberUser - Authenticated member user payload
 * @param props.body - Filter and pagination request
 * @returns Paginated list of favorite address summaries
 * @throws {Error} If database query fails
 */
export async function patch__shoppingMall_memberUser_favoriteAddresses(props: {
  memberUser: MemberuserPayload;
  body: IShoppingMallFavoriteAddress.IRequest;
}): Promise<IPageIShoppingMallFavoriteAddress.ISummary> {
  const { memberUser, body } = props;

  // Set pagination defaults
  const page = body.page ?? 1;
  const limit = body.limit ?? 10;

  // Build where filter including mandatory member user id
  const where = {
    shopping_mall_memberuser_id: memberUser.id,
    ...(body.created_at_from !== undefined && body.created_at_from !== null
      ? { created_at: { gte: body.created_at_from } }
      : {}),
    ...(body.created_at_to !== undefined && body.created_at_to !== null
      ? {
          created_at: {
            ...(body.created_at_from !== undefined &&
            body.created_at_from !== null
              ? { gte: body.created_at_from }
              : {}),
            lte: body.created_at_to,
          },
        }
      : {}),
  };

  // Validate sort field and direction
  const validSortFields = new Set(["created_at", "updated_at"]);
  let orderByField = "created_at";
  let orderByDirection: "asc" | "desc" = "desc";
  if (body.sort) {
    const [field, dir] = body.sort.split(":");
    if (validSortFields.has(field)) {
      orderByField = field;
      if (dir === "asc" || dir === "desc") {
        orderByDirection = dir;
      }
    }
  }

  // Inline orderBy for Prisma
  const orderBy = { [orderByField]: orderByDirection };

  // Run database queries in parallel
  const [rows, total] = await Promise.all([
    MyGlobal.prisma.shopping_mall_favorite_addresses.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        shopping_mall_snapshot_id: true,
        created_at: true,
      },
    }),
    MyGlobal.prisma.shopping_mall_favorite_addresses.count({ where }),
  ]);

  // Map results to summary and convert dates
  return {
    pagination: {
      current: Number(page),
      limit: Number(limit),
      records: total,
      pages: Math.ceil(total / limit),
    },
    data: rows.map((row) => ({
      id: row.id,
      shopping_mall_snapshot_id: row.shopping_mall_snapshot_id,
      created_at: toISOStringSafe(row.created_at),
    })),
  };
}
