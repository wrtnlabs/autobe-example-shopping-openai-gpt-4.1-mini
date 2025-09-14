import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallOrder } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrder";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Get detailed information for a specific order.
 *
 * This operation retrieves the order specified by orderId from the database. It
 * includes status, payment, pricing, member, channel, and optional section
 * details. Access is restricted to users with roles including adminUser.
 *
 * @param props - Object containing the authenticated adminUser and orderId.
 * @param props.adminUser - The authenticated admin user's payload
 * @param props.orderId - Unique order identifier (UUID format)
 * @returns Detailed order information matching IShoppingMallOrder
 * @throws Throws if the order with the given id does not exist
 */
export async function get__shoppingMall_adminUser_orders_$orderId(props: {
  adminUser: AdminuserPayload;
  orderId: string & tags.Format<"uuid">;
}): Promise<IShoppingMallOrder> {
  const { adminUser, orderId } = props;

  const order = await MyGlobal.prisma.shopping_mall_orders.findUniqueOrThrow({
    where: { id: orderId },
  });

  return {
    id: order.id,
    shopping_mall_memberuser_id: order.shopping_mall_memberuser_id,
    shopping_mall_channel_id: order.shopping_mall_channel_id,
    shopping_mall_section_id: order.shopping_mall_section_id ?? null,
    order_code: order.order_code,
    order_status: order.order_status,
    payment_status: order.payment_status,
    total_price: order.total_price,
    created_at: toISOStringSafe(order.created_at),
    updated_at: toISOStringSafe(order.updated_at),
    deleted_at: order.deleted_at ? toISOStringSafe(order.deleted_at) : null,
  };
}
