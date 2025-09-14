import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IPageIShoppingMallOrderItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallOrderItem";
import { GuestuserPayload } from "../decorators/payload/GuestuserPayload";

export async function patch__shoppingMall_guestUser_orders_$orderId_items(props: {
  guestUser: GuestuserPayload;
  orderId: string & tags.Format<"uuid">;
}): Promise<IPageIShoppingMallOrderItem> {
  const { guestUser, orderId } = props;

  const page = 1;
  const limit = 20;

  // Verify the order exists and belongs to the guest user
  const order = await MyGlobal.prisma.shopping_mall_orders.findUnique({
    where: { id: orderId },
    select: {
      id: true,
      shopping_mall_memberuser_id: true,
      deleted_at: true,
    },
  });

  if (!order || order.deleted_at !== null) {
    throw new Error("Order not found or deleted");
  }

  if (order.shopping_mall_memberuser_id !== guestUser.id) {
    throw new Error(
      "Unauthorized access: Order does not belong to this guest user",
    );
  }

  // Fetch paginated order items
  const [orderItems, total] = await Promise.all([
    MyGlobal.prisma.shopping_mall_order_items.findMany({
      where: { shopping_mall_order_id: orderId },
      skip: (page - 1) * limit,
      take: limit,
      orderBy: { created_at: "desc" },
    }),
    MyGlobal.prisma.shopping_mall_order_items.count({
      where: { shopping_mall_order_id: orderId },
    }),
  ]);

  // Convert dates to ISO strings
  const data = orderItems.map((item) => ({
    id: item.id,
    shopping_mall_order_id: item.shopping_mall_order_id,
    shopping_mall_sale_snapshot_id: item.shopping_mall_sale_snapshot_id,
    quantity: item.quantity,
    price: item.price,
    order_item_status: item.order_item_status,
    created_at: toISOStringSafe(item.created_at),
    updated_at: toISOStringSafe(item.updated_at),
  }));

  return {
    pagination: {
      current: Number(page),
      limit: Number(limit),
      records: total,
      pages: Math.ceil(total / limit),
    },
    data,
  };
}
