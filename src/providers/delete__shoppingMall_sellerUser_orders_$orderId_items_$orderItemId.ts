import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

/**
 * Delete a specific order item permanently from an order.
 *
 * This operation removes the record completely from the database, performing a
 * hard delete.
 *
 * Only seller users who own the order may execute this operation.
 *
 * @param props - Object containing sellerUser, orderId, and orderItemId
 * @param props.sellerUser - The authenticated seller user performing the
 *   deletion
 * @param props.orderId - Unique identifier of the target order
 * @param props.orderItemId - Unique identifier of the order item to delete
 * @throws {Error} When the order item is not found
 * @throws {Error} When the order item does not belong to the specified order
 * @throws {Error} When the order is not found
 * @throws {Error} When the seller user does not own the order
 */
export async function delete__shoppingMall_sellerUser_orders_$orderId_items_$orderItemId(props: {
  sellerUser: SelleruserPayload;
  orderId: string & tags.Format<"uuid">;
  orderItemId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { sellerUser, orderId, orderItemId } = props;

  // Fetch the order item to verify existence and order linkage
  const orderItem = await MyGlobal.prisma.shopping_mall_order_items.findUnique({
    where: { id: orderItemId },
  });
  if (!orderItem) {
    throw new Error("Order item not found");
  }

  // Verify the order id matches the orderItem's order id
  if (orderItem.shopping_mall_order_id !== orderId) {
    throw new Error("Order item does not belong to the specified order");
  }

  // Fetch the order to verify seller ownership
  const order = await MyGlobal.prisma.shopping_mall_orders.findUnique({
    where: { id: orderId },
  });
  if (!order) {
    throw new Error("Order not found");
  }

  // Authorize the seller user; seller ownership is verified by comparing member user id
  if (order.shopping_mall_memberuser_id !== sellerUser.id) {
    throw new Error("Unauthorized: You do not own this order");
  }

  // Proceed to hard delete the order item permanently
  await MyGlobal.prisma.shopping_mall_order_items.delete({
    where: { id: orderItemId },
  });
}
