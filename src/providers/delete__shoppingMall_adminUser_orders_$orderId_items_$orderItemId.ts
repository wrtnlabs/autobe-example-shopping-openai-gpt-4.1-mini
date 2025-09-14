import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Erase a specific order item from an order permanently.
 *
 * This operation deletes the record completely from the
 * shopping_mall_order_items table. Only admin users with proper authorization
 * can perform this action.
 *
 * @param props - Object containing required parameters and authenticated admin
 *   user.
 * @param props.adminUser - The authenticated admin user performing the
 *   operation.
 * @param props.orderId - UUID of the target order.
 * @param props.orderItemId - UUID of the order item to delete.
 * @throws {Error} When the order item does not exist.
 * @throws {Error} When the order item does not belong to the specified order
 *   (authorization failure).
 */
export async function delete__shoppingMall_adminUser_orders_$orderId_items_$orderItemId(props: {
  adminUser: AdminuserPayload;
  orderId: string & tags.Format<"uuid">;
  orderItemId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { adminUser, orderId, orderItemId } = props;

  const orderItem = await MyGlobal.prisma.shopping_mall_order_items.findUnique({
    where: { id: orderItemId },
  });

  if (!orderItem) throw new Error("Order item not found");

  if (orderItem.shopping_mall_order_id !== orderId) {
    throw new Error("Unauthorized: order item does not belong to given order");
  }

  await MyGlobal.prisma.shopping_mall_order_items.delete({
    where: { id: orderItemId },
  });
}
