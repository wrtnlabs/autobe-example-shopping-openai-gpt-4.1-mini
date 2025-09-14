import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { GuestuserPayload } from "../decorators/payload/GuestuserPayload";

/**
 * Erase a specific order item from an order
 *
 * Deletes the order item permanently from the database. Authorization: only the
 * guest user owning the order can perform this action.
 *
 * @param props - Object containing the guestUser, orderId, and orderItemId
 * @param props.guestUser - The authenticated guest user payload
 * @param props.orderId - The UUID of the order containing the item
 * @param props.orderItemId - The UUID of the order item to delete
 * @throws {Error} When order or order item does not exist
 * @throws {Error} When the guest user is unauthorized to delete the order item
 */
export async function delete__shoppingMall_guestUser_orders_$orderId_items_$orderItemId(props: {
  guestUser: GuestuserPayload;
  orderId: string & tags.Format<"uuid">;
  orderItemId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { guestUser, orderId, orderItemId } = props;

  // Find the order by orderId
  const order = await MyGlobal.prisma.shopping_mall_orders.findUnique({
    where: { id: orderId },
    select: { id: true, shopping_mall_memberuser_id: true },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  // Check if the order belongs to the guestUser
  if (order.shopping_mall_memberuser_id !== guestUser.id) {
    throw new Error("Unauthorized: You do not own this order");
  }

  // Check that order item belongs to the order
  const orderItem = await MyGlobal.prisma.shopping_mall_order_items.findUnique({
    where: { id: orderItemId },
    select: { id: true, shopping_mall_order_id: true },
  });

  if (!orderItem) {
    throw new Error("Order item not found");
  }

  if (orderItem.shopping_mall_order_id !== order.id) {
    throw new Error("Unauthorized: Order item does not belong to this order");
  }

  // Perform the hard delete
  await MyGlobal.prisma.shopping_mall_order_items.delete({
    where: { id: orderItemId },
  });
}
