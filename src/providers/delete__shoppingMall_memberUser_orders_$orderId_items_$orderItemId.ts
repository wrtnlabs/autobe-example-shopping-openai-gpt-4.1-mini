import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Erases a specific order item permanently from an order.
 *
 * This hard delete operation removes the specified order item identified by
 * `orderItemId` from the order identified by `orderId`.
 *
 * Authorization is strictly enforced: the order must belong to the
 * authenticated member user.
 *
 * @param props - Object containing memberUser authentication and parameters.
 * @param props.memberUser - The authenticated member user performing the
 *   action.
 * @param props.orderId - The UUID of the order containing the item.
 * @param props.orderItemId - The UUID of the order item to be deleted.
 * @returns Void
 * @throws {Error} If the order or order item is not found or authorization
 *   fails.
 */
export async function delete__shoppingMall_memberUser_orders_$orderId_items_$orderItemId(props: {
  memberUser: MemberuserPayload;
  orderId: string & tags.Format<"uuid">;
  orderItemId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { memberUser, orderId, orderItemId } = props;

  // Authorization check: verify order belongs to member user
  const order = await MyGlobal.prisma.shopping_mall_orders.findUnique({
    where: { id: orderId },
    select: { shopping_mall_memberuser_id: true },
  });
  if (!order) {
    throw new Error("Order not found");
  }
  if (order.shopping_mall_memberuser_id !== memberUser.id) {
    throw new Error(
      "Unauthorized: Order does not belong to the authenticated member",
    );
  }

  // Validate that the order item belongs to the given order
  const orderItem = await MyGlobal.prisma.shopping_mall_order_items.findUnique({
    where: { id: orderItemId },
    select: { shopping_mall_order_id: true },
  });
  if (!orderItem) {
    throw new Error("Order item not found");
  }
  if (orderItem.shopping_mall_order_id !== orderId) {
    throw new Error(
      "Unauthorized: Order item does not belong to the specified order",
    );
  }

  // Perform hard delete of the order item
  await MyGlobal.prisma.shopping_mall_order_items.delete({
    where: { id: orderItemId },
  });
}
