import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallOrderItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrderItem";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Retrieve detailed information of a specific order item within an order.
 *
 * This operation allows an authorized admin user to fetch data regarding a
 * particular item ordered by the customer, referencing the product snapshot at
 * the time of order placement to ensure consistency. The order item includes
 * details such as quantity ordered and unit price.
 *
 * @param props - Object containing the authenticated admin user payload, and
 *   the identifiers of the specific order and order item.
 * @param props.adminUser - The authenticated admin user making the request.
 * @param props.orderId - UUID of the order to which the item belongs.
 * @param props.orderItemId - UUID of the specific order item to retrieve.
 * @returns The detailed order item information matching the specified IDs.
 * @throws {Error} Throws if the order item with the given IDs is not found.
 */
export async function get__shoppingMall_adminUser_orders_$orderId_items_$orderItemId(props: {
  adminUser: AdminuserPayload;
  orderId: string & tags.Format<"uuid">;
  orderItemId: string & tags.Format<"uuid">;
}): Promise<IShoppingMallOrderItem> {
  const { adminUser, orderId, orderItemId } = props;

  const orderItem =
    await MyGlobal.prisma.shopping_mall_order_items.findUniqueOrThrow({
      where: {
        id: orderItemId,
        shopping_mall_order_id: orderId,
      },
    });

  return {
    id: orderItem.id,
    shopping_mall_order_id: orderItem.shopping_mall_order_id,
    shopping_mall_sale_snapshot_id: orderItem.shopping_mall_sale_snapshot_id,
    quantity: orderItem.quantity,
    price: orderItem.price,
    order_item_status: orderItem.order_item_status,
    created_at: toISOStringSafe(orderItem.created_at),
    updated_at: toISOStringSafe(orderItem.updated_at),
  };
}
