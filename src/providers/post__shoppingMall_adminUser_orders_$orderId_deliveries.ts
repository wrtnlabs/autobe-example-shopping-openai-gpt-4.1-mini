import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallDelivery } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallDelivery";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Create a delivery record for an order.
 *
 * Creates a new delivery entry linked to a specific shopping mall order,
 * supporting status, delivery stage, expected dates, and timestamps. Ensures
 * compliance with the API and Prisma schema contracts.
 *
 * @param props - Object containing adminUser auth, orderId, and delivery
 *   creation data
 * @param props.adminUser - Authenticated admin user making the request
 * @param props.orderId - UUID of the order to link the delivery record
 * @param props.body - Delivery creation details conforming to
 *   IShoppingMallDelivery.ICreate
 * @returns Promise resolving to the created delivery record
 * @throws {Error} Throws if database operation fails
 */
export async function post__shoppingMall_adminUser_orders_$orderId_deliveries(props: {
  adminUser: AdminuserPayload;
  orderId: string & tags.Format<"uuid">;
  body: IShoppingMallDelivery.ICreate;
}): Promise<IShoppingMallDelivery> {
  const { adminUser, orderId, body } = props;
  const now = toISOStringSafe(new Date());

  const created = await MyGlobal.prisma.shopping_mall_deliveries.create({
    data: {
      id: v4() as string & tags.Format<"uuid">,
      shopping_mall_order_id: orderId,
      delivery_status: body.delivery_status,
      delivery_stage: body.delivery_stage,
      expected_delivery_date: body.expected_delivery_date ?? null,
      start_time: body.start_time ?? null,
      end_time: body.end_time ?? null,
      created_at: now,
      updated_at: now,
    },
  });

  return {
    id: created.id as string & tags.Format<"uuid">,
    shopping_mall_order_id: created.shopping_mall_order_id as string &
      tags.Format<"uuid">,
    delivery_status: created.delivery_status,
    delivery_stage: created.delivery_stage,
    expected_delivery_date: created.expected_delivery_date
      ? toISOStringSafe(created.expected_delivery_date)
      : null,
    start_time: created.start_time ? toISOStringSafe(created.start_time) : null,
    end_time: created.end_time ? toISOStringSafe(created.end_time) : null,
    created_at: toISOStringSafe(created.created_at),
    updated_at: toISOStringSafe(created.updated_at),
  };
}
