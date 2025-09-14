import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallOrderItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrderItem";
import { GuestuserPayload } from "../decorators/payload/GuestuserPayload";

export async function get__shoppingMall_guestUser_orders_$orderId_items_$orderItemId(props: {
  guestUser: GuestuserPayload;
  orderId: string & tags.Format<"uuid">;
  orderItemId: string & tags.Format<"uuid">;
}): Promise<IShoppingMallOrderItem> {
  const { guestUser, orderId, orderItemId } = props;

  const order = await MyGlobal.prisma.shopping_mall_carts.findFirst({
    where: {
      id: orderId,
      guest_user_id: guestUser.id,
      deleted_at: null,
    },
  });

  if (!order) throw new Error("Order not found or unauthorized access");

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
