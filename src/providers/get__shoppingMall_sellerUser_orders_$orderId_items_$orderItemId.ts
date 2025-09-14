import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallOrderItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrderItem";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

/**
 * Retrieve detailed information of a specific order item within an order. This
 * operation allows authorized seller users to fetch data regarding a particular
 * item ordered by the customer, referencing the product snapshot at the time of
 * order placement to ensure consistency.
 *
 * @param props - Object containing sellerUser authentication info, orderId, and
 *   orderItemId path parameters
 * @param props.sellerUser - Authenticated seller user making the request
 * @param props.orderId - UUID of the order to retrieve the item from
 * @param props.orderItemId - UUID of the order item to retrieve
 * @returns Promise resolving to the detailed order item information conforming
 *   to IShoppingMallOrderItem
 * @throws {Error} Throws if order item with given identifiers does not exist
 */
export async function get__shoppingMall_sellerUser_orders_$orderId_items_$orderItemId(props: {
  sellerUser: SelleruserPayload;
  orderId: string & tags.Format<"uuid">;
  orderItemId: string & tags.Format<"uuid">;
}): Promise<IShoppingMallOrderItem> {
  const { sellerUser, orderId, orderItemId } = props;

  const orderItem =
    await MyGlobal.prisma.shopping_mall_order_items.findFirstOrThrow({
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
