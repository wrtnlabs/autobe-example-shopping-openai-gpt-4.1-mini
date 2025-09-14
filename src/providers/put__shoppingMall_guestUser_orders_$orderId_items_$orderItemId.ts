import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallOrderItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrderItem";
import { GuestuserPayload } from "../decorators/payload/GuestuserPayload";

export async function put__shoppingMall_guestUser_orders_$orderId_items_$orderItemId(props: {
  guestUser: GuestuserPayload;
  orderId: string & tags.Format<"uuid">;
  orderItemId: string & tags.Format<"uuid">;
  body: IShoppingMallOrderItem.IUpdate;
}): Promise<IShoppingMallOrderItem> {
  const { guestUser, orderId, orderItemId, body } = props;

  const order = await MyGlobal.prisma.shopping_mall_orders.findUnique({
    where: { id: orderId },
  });
  if (!order) throw new Error("Order not found");

  if (order.shopping_mall_memberuser_id !== guestUser.id) {
    throw new Error("Unauthorized: Order does not belong to the guest user");
  }

  const orderItem = await MyGlobal.prisma.shopping_mall_order_items.findUnique({
    where: { id: orderItemId },
  });
  if (!orderItem) throw new Error("Order item not found");

  if (orderItem.shopping_mall_order_id !== orderId) {
    throw new Error("Order item does not belong to the specified order");
  }

  const updateData: IShoppingMallOrderItem.IUpdate = {};

  if (body.quantity !== undefined) {
    if (body.quantity < 0) {
      throw new Error("Quantity must be non-negative");
    }
    updateData.quantity = body.quantity;
  }

  if (body.price !== undefined) updateData.price = body.price;
  if (body.order_item_status !== undefined)
    updateData.order_item_status = body.order_item_status;

  // 'updated_at' is not a property of IUpdate, omit it from update data
  // We rely on DB triggers or manual updating outside this scope if needed

  const updated = await MyGlobal.prisma.shopping_mall_order_items.update({
    where: { id: orderItemId },
    data: updateData,
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
