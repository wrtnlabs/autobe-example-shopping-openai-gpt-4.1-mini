import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallCouponLog } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCouponLog";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Retrieve coupon log details by unique ID.
 *
 * This operation fetches detailed coupon log information by the given coupon
 * log ID from the shopping_mall_coupon_logs table. Access is restricted to
 * authenticated adminUser roles.
 *
 * @param props - Object containing admin user payload and coupon log ID
 * @param props.adminUser - Authenticated admin user payload
 * @param props.id - Unique UUID identifier for the coupon log
 * @returns Detailed coupon log entry matching the ID
 * @throws {Error} Throws if coupon log with given ID does not exist
 */
export async function get__shoppingMall_adminUser_couponLogs_$id(props: {
  adminUser: AdminuserPayload;
  id: string & tags.Format<"uuid">;
}): Promise<IShoppingMallCouponLog> {
  const { id } = props;

  const found =
    await MyGlobal.prisma.shopping_mall_coupon_logs.findUniqueOrThrow({
      where: { id },
      select: {
        id: true,
        shopping_mall_coupon_ticket_id: true,
        used_by_customer_id: true,
        log_type: true,
        log_data: true,
        logged_at: true,
      },
    });

  return {
    id: found.id,
    shopping_mall_coupon_ticket_id: found.shopping_mall_coupon_ticket_id,
    used_by_customer_id: found.used_by_customer_id ?? null,
    log_type: found.log_type,
    log_data: found.log_data ?? null,
    logged_at: toISOStringSafe(found.logged_at),
  };
}
