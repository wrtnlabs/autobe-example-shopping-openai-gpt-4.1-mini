import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallCouponLog } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCouponLog";
import { IPageIShoppingMallCouponLog } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallCouponLog";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Search and retrieve coupon log entries for tracking coupon usage and
 * lifecycle events.
 *
 * This endpoint filters coupon log records by coupon ticket ID, customer user
 * ID, log types, and date ranges. It returns a paginated list suitable for
 * audit and reporting by authenticated member users.
 *
 * @param props - Request properties
 * @param props.memberUser - The authenticated member user making the request
 * @param props.body - Search criteria and pagination parameters
 * @returns Paginated list of coupon log records matching the search parameters
 * @throws {Error} When no matching logs are found
 */
export async function patch__shoppingMall_memberUser_couponLogs(props: {
  memberUser: MemberuserPayload;
  body: IShoppingMallCouponLog.IRequest;
}): Promise<IPageIShoppingMallCouponLog> {
  const { memberUser, body } = props;
  const page = body.page ?? 1;
  const limit = body.limit ?? 10;

  const whereCondition = {
    ...(body.shopping_mall_coupon_ticket_id !== undefined &&
      body.shopping_mall_coupon_ticket_id !== null && {
        shopping_mall_coupon_ticket_id: body.shopping_mall_coupon_ticket_id,
      }),
    ...(body.used_by_customer_id !== undefined &&
      body.used_by_customer_id !== null && {
        used_by_customer_id: body.used_by_customer_id,
      }),
    ...(body.log_type !== undefined &&
      body.log_type !== null && {
        log_type: body.log_type,
      }),
    ...((body.logged_at_from !== undefined && body.logged_at_from !== null) ||
    (body.logged_at_to !== undefined && body.logged_at_to !== null)
      ? {
          logged_at: {
            ...(body.logged_at_from !== undefined &&
              body.logged_at_from !== null && { gte: body.logged_at_from }),
            ...(body.logged_at_to !== undefined &&
              body.logged_at_to !== null && { lte: body.logged_at_to }),
          },
        }
      : {}),
  };

  const [results, total] = await Promise.all([
    MyGlobal.prisma.shopping_mall_coupon_logs.findMany({
      where: whereCondition,
      orderBy: { logged_at: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    MyGlobal.prisma.shopping_mall_coupon_logs.count({ where: whereCondition }),
  ]);

  if (total === 0) {
    throw new Error("No matching coupon logs found");
  }

  return {
    pagination: {
      current: Number(page),
      limit: Number(limit),
      records: total,
      pages: Math.ceil(total / limit),
    },
    data: results.map((item) => ({
      id: item.id,
      shopping_mall_coupon_ticket_id: item.shopping_mall_coupon_ticket_id,
      used_by_customer_id: item.used_by_customer_id ?? null,
      log_type: item.log_type,
      log_data: item.log_data ?? null,
      logged_at: toISOStringSafe(item.logged_at),
    })),
  };
}
