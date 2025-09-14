import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallOrderItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrderItem";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Add a new order item to a specific order
 *
 * This endpoint allows an authenticated member user to add a new product item
 * to an existing order they own. The operation validates access to the order
 * and the existence of the referenced product snapshot.
 *
 * @param props - Object containing memberUser credentials, orderId URL param,
 *   and request body with order item details.
 * @param props.memberUser - Authenticated member user payload
 * @param props.orderId - UUID of the target order
 * @param props.body - Order item creation data
 * @returns The newly created order item record
 * @throws {Error} If the order is not found or not accessible by the memberUser
 * @throws {Error} If the referenced product snapshot does not exist
 */
export async function post__shoppingMall_memberUser_orders_$orderId_items(props: {
  memberUser: MemberuserPayload;
  orderId: string & tags.Format<"uuid">;
  body: IShoppingMallOrderItem.ICreate;
}): Promise<IShoppingMallOrderItem> {
  const { memberUser, orderId, body } = props;

  const order = await MyGlobal.prisma.shopping_mall_orders.findUnique({
    where: { id: orderId },
    select: { shopping_mall_memberuser_id: true },
  });

  if (!order || order.shopping_mall_memberuser_id !== memberUser.id) {
    throw new Error("Order not found or not accessible");
  }

  const snapshot =
    await MyGlobal.prisma.shopping_mall_sale_snapshots.findUnique({
      where: { id: body.shopping_mall_sale_snapshot_id },
    });

  if (!snapshot) {
    throw new Error("Referenced product snapshot not found");
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
