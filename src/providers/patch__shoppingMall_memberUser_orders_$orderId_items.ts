import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IPageIShoppingMallOrderItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallOrderItem";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

export async function patch__shoppingMall_memberUser_orders_$orderId_items(props: {
  memberUser: MemberuserPayload;
  orderId: string & tags.Format<"uuid">;
}): Promise<IPageIShoppingMallOrderItem> {
  const { memberUser, orderId } = props;

  const page = 1;
  const limit = 10;
  const skip = (page - 1) * limit;

  const order = await MyGlobal.prisma.shopping_mall_orders.findUnique({
    where: { id: orderId },
  });
  if (!order || order.shopping_mall_memberuser_id !== memberUser.id) {
    throw new Error("Unauthorized or order not found");
  }

  const [items, total] = await Promise.all([
    MyGlobal.prisma.shopping_mall_order_items.findMany({
      where: {
        shopping_mall_order_id: orderId,
      },
      skip,
      take: limit,
    }),
    MyGlobal.prisma.shopping_mall_order_items.count({
      where: {
        shopping_mall_order_id: orderId,
      },
    }),
  ]);

  return {
    pagination: {
      current: Number(page),
      limit: Number(limit),
      records: total,
      pages: Math.ceil(total / limit),
    },
    data: items.map((item) => ({
      id: item.id,
      shopping_mall_order_id: item.shopping_mall_order_id,
      shopping_mall_sale_snapshot_id: item.shopping_mall_sale_snapshot_id,
      quantity: item.quantity,
      price: item.price,
      order_item_status: item.order_item_status,
      created_at: toISOStringSafe(item.created_at),
      updated_at: toISOStringSafe(item.updated_at),
    })),
  };
}
