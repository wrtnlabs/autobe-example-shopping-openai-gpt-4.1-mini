import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallOrderItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrderItem";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Retrieve a specific order item information by orderId and orderItemId.
 *
 * This operation retrieves detailed information of a specific order item within
 * an order. It enforces authorization through the memberUser payload and
 * ensures that the order item belongs to the specified order.
 *
 * @param props - Object containing memberUser payload and identifying order
 *   parameters
 * @param props.memberUser - Authenticated member user making the request
 * @param props.orderId - UUID string identifying the order
 * @param props.orderItemId - UUID string identifying the order item
 * @returns The detailed order item information matching specified identifiers
 * @throws {Error} Throws if the order item or order does not exist or
 *   unauthorized access
 */
export async function get__shoppingMall_memberUser_orders_$orderId_items_$orderItemId(props: {
  memberUser: MemberuserPayload;
  orderId: string & tags.Format<"uuid">;
  orderItemId: string & tags.Format<"uuid">;
}): Promise<IShoppingMallOrderItem> {
  const { memberUser, orderId, orderItemId } = props;

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
