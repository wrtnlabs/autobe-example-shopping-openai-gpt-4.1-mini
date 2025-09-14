import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallOrderAuditLog } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrderAuditLog";
import { IPageIShoppingMallOrderAuditLog } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallOrderAuditLog";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Search and retrieve paged order audit log records.
 *
 * This endpoint allows authenticated member users to filter and paginate
 * through detailed audit logs recording actions taken on orders. Filtering
 * criteria include order ID, actor user ID, action descriptions, and performed
 * date ranges.
 *
 * @param props - Request properties
 * @param props.memberUser - Authenticated member user making the request
 * @param props.body - Filter and pagination parameters for order audit logs
 * @returns Paged list of order audit logs matching the filters
 * @throws {Error} If any unexpected error occurs during database access
 */
export async function patch__shoppingMall_memberUser_orderAuditLogs(props: {
  memberUser: MemberuserPayload;
  body: IShoppingMallOrderAuditLog.IRequest;
}): Promise<IPageIShoppingMallOrderAuditLog> {
  const { memberUser, body } = props;

  const where = {
    ...(body.shopping_mall_order_id !== undefined &&
      body.shopping_mall_order_id !== null && {
        shopping_mall_order_id: body.shopping_mall_order_id,
      }),
    ...(body.actor_user_id !== undefined &&
      body.actor_user_id !== null && { actor_user_id: body.actor_user_id }),
    ...(body.action !== undefined &&
      body.action !== null && { action: { contains: body.action } }),
    ...((body.performed_at_from !== undefined &&
      body.performed_at_from !== null) ||
    (body.performed_at_to !== undefined && body.performed_at_to !== null)
      ? {
          performed_at: {
            ...(body.performed_at_from !== undefined &&
              body.performed_at_from !== null && {
                gte: body.performed_at_from,
              }),
            ...(body.performed_at_to !== undefined &&
              body.performed_at_to !== null && { lte: body.performed_at_to }),
          },
        }
      : {}),
  };

  const page = body.page ?? 1;
  const limit = body.limit ?? 10;
  const skip = (page - 1) * limit;

  const [rows, total] = await Promise.all([
    MyGlobal.prisma.shopping_mall_order_audit_logs.findMany({
      where,
      orderBy: { performed_at: "desc" },
      skip,
      take: limit,
    }),
    MyGlobal.prisma.shopping_mall_order_audit_logs.count({ where }),
  ]);

  return {
    pagination: {
      current: Number(page),
      limit: Number(limit),
      records: total,
      pages: Math.ceil(total / limit),
    },
    data: rows.map((row) => ({
      id: row.id,
      shopping_mall_order_id: row.shopping_mall_order_id,
      actor_user_id: row.actor_user_id ?? null,
      action: row.action,
      action_details: row.action_details ?? null,
      performed_at: toISOStringSafe(row.performed_at),
    })),
  };
}
