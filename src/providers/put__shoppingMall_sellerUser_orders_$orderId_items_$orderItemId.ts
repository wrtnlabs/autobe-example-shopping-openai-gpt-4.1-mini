import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallOrderItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrderItem";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

/**
 * Update a specific order item within an order.
 *
 * This operation updates details of a specific order item within an order, such
 * as quantity, price, and order status. The updating seller user must own the
 * sale product associated with the order item.
 *
 * @param props - Object containing sellerUser, orderId, orderItemId, and the
 *   update body with optional fields.
 * @returns The updated order item information.
 * @throws {Error} When the order item, order, or sale product does not exist.
 * @throws {Error} When the seller user does not own the sale product.
 * @throws {Error} When quantity or price is negative.
 */
export async function put__shoppingMall_sellerUser_orders_$orderId_items_$orderItemId(props: {
  sellerUser: SelleruserPayload;
  orderId: string & tags.Format<"uuid">;
  orderItemId: string & tags.Format<"uuid">;
  body: IShoppingMallOrderItem.IUpdate;
}): Promise<IShoppingMallOrderItem> {
  const { sellerUser, orderId, orderItemId, body } = props;

  const orderItem = await MyGlobal.prisma.shopping_mall_order_items.findUnique({
    where: { id: orderItemId },
  });

  if (!orderItem) {
    throw new Error("Order item not found.");
  }

  const order = await MyGlobal.prisma.shopping_mall_orders.findUnique({
    where: { id: orderItem.shopping_mall_order_id },
  });

  if (!order) {
    throw new Error("Order not found.");
  }

  const sale = await MyGlobal.prisma.shopping_mall_sales.findUnique({
    where: { id: orderItem.shopping_mall_sale_snapshot_id },
  });

  if (!sale) {
    throw new Error("Sale product not found.");
  }

  if (sale.shopping_mall_seller_user_id !== sellerUser.id) {
    throw new Error("Unauthorized: Seller does not own this order item.");
  }

  if (body.quantity !== undefined && body.quantity < 0) {
    throw new Error("Quantity cannot be negative.");
  }

  if (body.price !== undefined && body.price < 0) {
    throw new Error("Price cannot be negative.");
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
