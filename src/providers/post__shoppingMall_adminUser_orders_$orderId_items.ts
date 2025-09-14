import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallOrderItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrderItem";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

export async function post__shoppingMall_adminUser_orders_$orderId_items(props: {
  adminUser: AdminuserPayload;
  orderId: string & tags.Format<"uuid">;
  body: IShoppingMallOrderItem.ICreate;
}): Promise<IShoppingMallOrderItem> {
  const { adminUser, orderId, body } = props;

  // Verify the order exists
  await MyGlobal.prisma.shopping_mall_orders.findUniqueOrThrow({
    where: { id: orderId },
  });

  const now = toISOStringSafe(new Date());

  // Create the new order item
  const created = await MyGlobal.prisma.shopping_mall_order_items.create({
    data: {
      id: v4() as string & tags.Format<"uuid">,
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
    created_at: now,
    updated_at: now,
  };
}
