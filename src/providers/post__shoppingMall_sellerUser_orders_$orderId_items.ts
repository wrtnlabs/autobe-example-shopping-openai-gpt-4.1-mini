import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallOrderItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrderItem";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

export async function post__shoppingMall_sellerUser_orders_$orderId_items(props: {
  sellerUser: SelleruserPayload;
  orderId: string & tags.Format<"uuid">;
  body: IShoppingMallOrderItem.ICreate;
}): Promise<IShoppingMallOrderItem> {
  const { sellerUser, orderId, body } = props;

  // Verify that the order exists and belongs to authenticated sellerUser
  const order = await MyGlobal.prisma.shopping_mall_orders.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      shopping_mall_seller_user_id: true,
    },
  });

  if (order === null) {
    throw new Error("Order not found");
  }

  if (order.shopping_mall_seller_user_id !== sellerUser.id) {
    throw new Error("Unauthorized: sellerUser does not own this order");
  }

  // Verify that the sale snapshot exists
  const snapshot =
    await MyGlobal.prisma.shopping_mall_sale_snapshots.findUnique({
      where: { id: body.shopping_mall_sale_snapshot_id },
      select: { id: true },
    });

  if (snapshot === null) {
    throw new Error("Invalid sale snapshot reference");
  }

  if (body.quantity <= 0) {
    throw new Error("Quantity must be positive");
  }

  if (body.price <= 0) {
    throw new Error("Price must be positive");
  }

  const now = toISOStringSafe(new Date());

  const created = await MyGlobal.prisma.shopping_mall_order_items.create({
    data: {
      id: v4(),
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
