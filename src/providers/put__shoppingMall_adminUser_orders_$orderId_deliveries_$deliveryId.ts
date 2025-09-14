import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallDelivery } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallDelivery";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Update a delivery record for a specific order.
 *
 * Updates delivery status, stage, and scheduling timestamps for shipment
 * tracking. Requires authenticated admin user authorization.
 *
 * @param props - Object containing authenticated adminUser, orderId,
 *   deliveryId, and update body.
 * @returns Updated delivery record conforming to IShoppingMallDelivery.
 * @throws {Error} If the specified delivery does not exist.
 */
export async function put__shoppingMall_adminUser_orders_$orderId_deliveries_$deliveryId(props: {
  adminUser: AdminuserPayload;
  orderId: string & tags.Format<"uuid">;
  deliveryId: string & tags.Format<"uuid">;
  body: IShoppingMallDelivery.IUpdate;
}): Promise<IShoppingMallDelivery> {
  const { adminUser, orderId, deliveryId, body } = props;

  const now = toISOStringSafe(new Date());

  const updated = await MyGlobal.prisma.shopping_mall_deliveries.update({
    where: {
      id: deliveryId,
      shopping_mall_order_id: orderId,
    },
    data: {
      delivery_status: body.delivery_status,
      delivery_stage: body.delivery_stage,
      expected_delivery_date: body.expected_delivery_date ?? null,
      start_time: body.start_time ?? null,
      end_time: body.end_time ?? null,
      updated_at: now,
    },
  });

  return {
    id: updated.id,
    shopping_mall_order_id: updated.shopping_mall_order_id,
    delivery_status: updated.delivery_status,
    delivery_stage: updated.delivery_stage,
    expected_delivery_date: updated.expected_delivery_date
      ? toISOStringSafe(updated.expected_delivery_date)
      : null,
    start_time: updated.start_time ? toISOStringSafe(updated.start_time) : null,
    end_time: updated.end_time ? toISOStringSafe(updated.end_time) : null,
    created_at: toISOStringSafe(updated.created_at),
    updated_at: toISOStringSafe(updated.updated_at),
  };
}
