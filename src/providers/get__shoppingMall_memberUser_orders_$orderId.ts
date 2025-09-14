import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallOrder } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrder";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Retrieves detailed information of an order by its unique identifier.
 *
 * This endpoint returns comprehensive order data including status, payment,
 * pricing, and associated member, channel, and section identifiers.
 *
 * Authentication is required for memberUser role and authorization ensures that
 * only the owning memberUser can access their order details.
 *
 * @param props - Object containing memberUser auth payload and orderId
 *   parameter
 * @param props.memberUser - Authenticated member user payload
 * @param props.orderId - Unique order identifier
 * @returns Promise resolving to detailed order information matching
 *   IShoppingMallOrder
 * @throws {Error} When the order does not exist or user is unauthorized
 */
export async function get__shoppingMall_memberUser_orders_$orderId(props: {
  memberUser: MemberuserPayload;
  orderId: string & tags.Format<"uuid">;
}): Promise<IShoppingMallOrder> {
  const { memberUser, orderId } = props;

  const order = await MyGlobal.prisma.shopping_mall_orders.findUniqueOrThrow({
    where: { id: orderId },
    select: {
      id: true,
      shopping_mall_memberuser_id: true,
      shopping_mall_channel_id: true,
      shopping_mall_section_id: true,
      order_code: true,
      order_status: true,
      payment_status: true,
      total_price: true,
      created_at: true,
      updated_at: true,
      deleted_at: true,
    },
  });

  if (order.shopping_mall_memberuser_id !== memberUser.id) {
    throw new Error("Unauthorized: You can only access your own orders");
  }

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
