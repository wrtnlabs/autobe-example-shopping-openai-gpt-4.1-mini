import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IPageIShoppingMallOrderItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallOrderItem";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Retrieves a paginated list of order items for a given order ID.
 *
 * This function fetches order items from the `shopping_mall_order_items` table,
 * filtering by the specified order ID, with pagination support.
 *
 * Authorization: Only accessible by authenticated admin users.
 *
 * @param props - The function parameters object.
 * @param props.adminUser - The authenticated admin user payload.
 * @param props.orderId - The UUID of the order to fetch items for.
 * @returns A paginated list of order items matching the order ID.
 * @throws {Error} Throws if there's a database access error.
 */
export async function patch__shoppingMall_adminUser_orders_$orderId_items(props: {
  adminUser: AdminuserPayload;
  orderId: string & tags.Format<"uuid">;
}): Promise<IPageIShoppingMallOrderItem> {
  const { adminUser, orderId } = props;
  const page = 1;
  const limit = 20;

  const [items, total] = await Promise.all([
    MyGlobal.prisma.shopping_mall_order_items.findMany({
      where: { shopping_mall_order_id: orderId },
      orderBy: { created_at: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    MyGlobal.prisma.shopping_mall_order_items.count({
      where: { shopping_mall_order_id: orderId },
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
