import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallOrderItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrderItem";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Update a specific order item within an order for a member user.
 *
 * This function updates existing order item details such as quantity, price,
 * and status as provided in the request body.
 *
 * It verifies that the order item and order exist and that the order belongs to
 * the authenticated member user.
 *
 * All date fields are returned as ISO 8601 date-time strings.
 *
 * @param props - Object containing:
 *
 *   - MemberUser: The authenticated member user payload
 *   - OrderId: UUID of the parent order
 *   - OrderItemId: UUID of the specific order item to update
 *   - Body: Fields for updating the order item
 *
 * @returns The updated order item information
 * @throws {Error} When the order or order item is not found
 * @throws {Error} When the order does not belong to the member user
 */
export async function put__shoppingMall_memberUser_orders_$orderId_items_$orderItemId(props: {
  memberUser: MemberuserPayload;
  orderId: string & tags.Format<"uuid">;
  orderItemId: string & tags.Format<"uuid">;
  body: IShoppingMallOrderItem.IUpdate;
}): Promise<IShoppingMallOrderItem> {
  const { memberUser, orderId, orderItemId, body } = props;

  const orderItem = await MyGlobal.prisma.shopping_mall_order_items.findFirst({
    where: {
      id: orderItemId,
      shopping_mall_order_id: orderId,
    },
  });

  if (!orderItem) throw new Error("Order item not found");

  const order = await MyGlobal.prisma.shopping_mall_orders.findUnique({
    where: { id: orderId },
  });

  if (!order) throw new Error("Order not found");

  if (order.shopping_mall_memberuser_id !== memberUser.id) {
    throw new Error("Unauthorized: This order does not belong to the member");
  }

  const updated = await MyGlobal.prisma.shopping_mall_order_items.update({
    where: { id: orderItemId },
    data: {
      shopping_mall_sale_snapshot_id:
        body.shopping_mall_sale_snapshot_id ?? undefined,
      quantity: body.quantity ?? undefined,
      price: body.price ?? undefined,
      order_item_status: body.order_item_status ?? undefined,
    },
  });

  return {
    id: updated.id,
    shopping_mall_order_id: updated.shopping_mall_order_id,
    shopping_mall_sale_snapshot_id: updated.shopping_mall_sale_snapshot_id,
    quantity: updated.quantity,
    price: updated.price,
    order_item_status: updated.order_item_status,
    created_at: toISOStringSafe(updated.created_at),
    updated_at: toISOStringSafe(updated.updated_at),
  };
}
