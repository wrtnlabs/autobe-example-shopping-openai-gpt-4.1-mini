import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallOrder } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrder";
import { GuestuserPayload } from "../decorators/payload/GuestuserPayload";

/**
 * Get detailed information for a specific order
 *
 * Retrieves detailed information about an order specified by orderId from the
 * shopping_mall_orders table. Returns status, payment, pricing, member,
 * channel, and section details. Access restricted to roles guestUser,
 * memberUser, sellerUser, and adminUser, ensuring order data confidentiality
 * and security.
 *
 * @param props - Object containing guestUser payload and the orderId string
 *   UUID
 * @param props.guestUser - The authenticated guest user payload
 * @param props.orderId - Unique identifier of the order to be retrieved
 * @returns The detailed order information conforming to IShoppingMallOrder
 * @throws {Error} When the order with the specified orderId does not exist
 */
export async function get__shoppingMall_guestUser_orders_$orderId(props: {
  guestUser: GuestuserPayload;
  orderId: string & tags.Format<"uuid">;
}): Promise<IShoppingMallOrder> {
  const { guestUser, orderId } = props;

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
