import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallOrderItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrderItem";
import { GuestuserPayload } from "../decorators/payload/GuestuserPayload";

/**
 * Add a new order item to a specific order.
 *
 * Create a new order item within a specified order. Authorized guest users can
 * add products associated with specific snapshots to existing orders.
 *
 * @param props - Object containing the guest user authentication, orderId, and
 *   order item creation data
 * @param props.guestUser - The authenticated guest user making the request
 * @param props.orderId - UUID of the order to add the item to
 * @param props.body - Order item creation details including product snapshot,
 *   quantity, price, and status
 * @returns The created order item with all fields populated
 * @throws {Error} When the specified order is not found
 */
export async function post__shoppingMall_guestUser_orders_$orderId_items(props: {
  guestUser: GuestuserPayload;
  orderId: string & tags.Format<"uuid">;
  body: IShoppingMallOrderItem.ICreate;
}): Promise<IShoppingMallOrderItem> {
  const { guestUser, orderId, body } = props;

  const order = await MyGlobal.prisma.shopping_mall_orders.findFirst({
    where: { id: orderId, deleted_at: null },
  });

  if (!order) throw new Error("Order not found");

  const id = v4() as string & tags.Format<"uuid">;
  const now = toISOStringSafe(new Date());

  const created = await MyGlobal.prisma.shopping_mall_order_items.create({
    data: {
      id,
      shopping_mall_order_id: orderId,
      shopping_mall_sale_snapshot_id: body.shopping_mall_sale_snapshot_id,
      quantity: body.quantity,
      price: body.price,
      order_item_status: body.order_item_status,
      created_at: now,
      updated_at: now,
    },
  });

  return {
    id: created.id,
    shopping_mall_order_id: created.shopping_mall_order_id,
    shopping_mall_sale_snapshot_id: created.shopping_mall_sale_snapshot_id,
    quantity: created.quantity,
    price: created.price,
    order_item_status: created.order_item_status,
    created_at: toISOStringSafe(created.created_at),
    updated_at: toISOStringSafe(created.updated_at),
  };
}
