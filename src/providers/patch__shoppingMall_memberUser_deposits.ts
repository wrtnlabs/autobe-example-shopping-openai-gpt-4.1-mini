import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallDeposit } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallDeposit";
import { IPageIShoppingMallDeposit } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallDeposit";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Search and retrieve paginated list of deposits
 *
 * This endpoint retrieves deposit records filtered by various criteria such as
 * user IDs, deposit amounts ranges, deposit validity period, and status. It
 * supports pagination and sorting by a specified field with descending order by
 * default.
 *
 * Access is limited to authenticated users with the 'memberUser' role to
 * protect privacy.
 *
 * @param props - Request properties
 * @param props.memberUser - Authenticated member user making the request
 * @param props.body - Filtering options for deposits
 * @returns Paginated summary list of deposits matching the filter criteria
 * @throws {Error} When database access errors occur or invalid parameters
 */
export async function patch__shoppingMall_memberUser_deposits(props: {
  memberUser: MemberuserPayload;
  body: IShoppingMallDeposit.IRequest;
}): Promise<IPageIShoppingMallDeposit.ISummary> {
  const { memberUser, body } = props;
  const page = body.page ?? 0;
  const limit = body.limit ?? 10;

  // Build the Prisma where condition with explicit null checks
  const whereCondition = {
    deleted_at: null,
    ...(body.guestuser_id !== undefined &&
      body.guestuser_id !== null && { guestuser_id: body.guestuser_id }),
    ...(body.memberuser_id !== undefined &&
      body.memberuser_id !== null && { memberuser_id: body.memberuser_id }),
    ...(body.deposit_amount_min !== undefined &&
      body.deposit_amount_min !== null && {
        deposit_amount: { gte: body.deposit_amount_min },
      }),
    ...(body.deposit_amount_max !== undefined &&
      body.deposit_amount_max !== null && {
        deposit_amount: { lte: body.deposit_amount_max },
      }),
    ...(body.usable_balance_min !== undefined &&
      body.usable_balance_min !== null && {
        usable_balance: { gte: body.usable_balance_min },
      }),
    ...(body.usable_balance_max !== undefined &&
      body.usable_balance_max !== null && {
        usable_balance: { lte: body.usable_balance_max },
      }),
    ...((body.deposit_start_at_from !== undefined &&
      body.deposit_start_at_from !== null) ||
    (body.deposit_start_at_to !== undefined &&
      body.deposit_start_at_to !== null)
      ? {
          deposit_start_at: {
            ...(body.deposit_start_at_from !== undefined &&
              body.deposit_start_at_from !== null && {
                gte: body.deposit_start_at_from,
              }),
            ...(body.deposit_start_at_to !== undefined &&
              body.deposit_start_at_to !== null && {
                lte: body.deposit_start_at_to,
              }),
          },
        }
      : {}),
    ...((body.deposit_end_at_from !== undefined &&
      body.deposit_end_at_from !== null) ||
    (body.deposit_end_at_to !== undefined && body.deposit_end_at_to !== null)
      ? {
          deposit_end_at: {
            ...(body.deposit_end_at_from !== undefined &&
              body.deposit_end_at_from !== null && {
                gte: body.deposit_end_at_from,
              }),
            ...(body.deposit_end_at_to !== undefined &&
              body.deposit_end_at_to !== null && {
                lte: body.deposit_end_at_to,
              }),
          },
        }
      : {}),
    ...(body.status !== undefined &&
      body.status !== null && { status: body.status }),
  };

  // Determine orderBy field, defaulting to created_at descending
  const orderByField =
    typeof body.orderBy === "string" && body.orderBy.length > 0
      ? body.orderBy
      : "created_at";

  // Prisma ordering object
  const orderBy = {
    [orderByField]: "desc" as const,
  };

  // Query data and total count concurrently
  const [rows, total] = await Promise.all([
    MyGlobal.prisma.shopping_mall_deposits.findMany({
      where: whereCondition,
      orderBy,
      skip: page * limit,
      take: limit,
    }),
    MyGlobal.prisma.shopping_mall_deposits.count({ where: whereCondition }),
  ]);

  // Map results to response summary format, converting dates properly
  const data = rows.map((row) => ({
    id: row.id,
    deposit_amount: row.deposit_amount,
    usable_balance: row.usable_balance,
    deposit_start_at: toISOStringSafe(row.deposit_start_at),
    deposit_end_at: toISOStringSafe(row.deposit_end_at),
  }));

  // Compose pagination info
  const pagination = {
    current: Number(page),
    limit: Number(limit),
    records: total,
    pages: Math.ceil(total / limit),
  };

  return {
    pagination,
    data,
  };
}
