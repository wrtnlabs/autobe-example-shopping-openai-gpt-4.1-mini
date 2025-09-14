import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallOrderItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrderItem";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Update a specific order item within an order.
 *
 * This operation updates fields such as quantity, price, and order item status
 * for the targeted shopping mall order item. Ensures the order item belongs to
 * the specified orderId for data integrity.
 *
 * Authorization: Requires adminUser role.
 *
 * @param props - Object containing adminUser payload, orderId, orderItemId, and
 *   update body.
 * @returns The updated order item with all fields converted properly.
 * @throws {Error} If the order item is not found.
 * @throws {Error} If the order item does not belong to the given order.
 * @throws {Error} If quantity is not positive.
 * @throws {Error} If price is negative.
 */
export async function put__shoppingMall_adminUser_orders_$orderId_items_$orderItemId(props: {
  adminUser: AdminuserPayload;
  orderId: string & tags.Format<"uuid">;
  orderItemId: string & tags.Format<"uuid">;
  body: IShoppingMallOrderItem.IUpdate;
}): Promise<IShoppingMallOrderItem> {
  const { adminUser, orderId, orderItemId, body } = props;

  // Fetch the order item by id
  const existingOrderItem =
    await MyGlobal.prisma.shopping_mall_order_items.findUnique({
      where: { id: orderItemId },
    });

  if (!existingOrderItem) throw new Error("Order item not found");

  // Check belonging to order
  if (existingOrderItem.shopping_mall_order_id !== orderId) {
    throw new Error("Order item does not belong to the given order");
  }

  // Validate quantity if provided
  if (body.quantity !== undefined && body.quantity <= 0) {
    throw new Error("Quantity must be positive");
  }

  // Validate price if provided
  if (body.price !== undefined && body.price < 0) {
    throw new Error("Price cannot be negative");
  }

  const updated = await MyGlobal.prisma.shopping_mall_order_items.update({
    where: { id: orderItemId },
    data: {
      shopping_mall_order_id: body.shopping_mall_order_id ?? undefined,
      shopping_mall_sale_snapshot_id:
        body.shopping_mall_sale_snapshot_id ?? undefined,
      quantity: body.quantity ?? undefined,
      price: body.price ?? undefined,
      order_item_status: body.order_item_status ?? undefined,
      updated_at: toISOStringSafe(new Date()),
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
