import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallDelivery } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallDelivery";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

/**
 * Update delivery record for an order
 *
 * This operation updates information for a specific delivery record belonging
 * to an order. Supports modifying delivery stage, status, timestamps, and notes
 * for shipment tracking.
 *
 * Authorization is enforced: only the seller user owning the order can update
 * the delivery.
 *
 * @param props - Object containing seller user, orderId, deliveryId and update
 *   body
 * @returns The updated delivery record conforming to IShoppingMallDelivery
 * @throws {Error} When delivery or order is not found or authorization fails
 */
export async function put__shoppingMall_sellerUser_orders_$orderId_deliveries_$deliveryId(props: {
  sellerUser: SelleruserPayload;
  orderId: string & import("typia").tags.Format<"uuid">;

  deliveryId: string & import("typia").tags.Format<"uuid">;

  body: IShoppingMallDelivery.IUpdate;
}): Promise<IShoppingMallDelivery> {
  const { sellerUser, orderId, deliveryId, body } = props;

  const delivery = await MyGlobal.prisma.shopping_mall_deliveries.findUnique({
    where: { id: deliveryId },
    select: {
      id: true,
      shopping_mall_order_id: true,
      delivery_status: true,
      delivery_stage: true,
      expected_delivery_date: true,
      start_time: true,
      end_time: true,
      created_at: true,
      updated_at: true,
    },
  });

  if (!delivery) {
    throw new Error("Delivery record not found");
  }

  if (delivery.shopping_mall_order_id !== orderId) {
    throw new Error("Delivery does not belong to specified order");
  }

  const order = await MyGlobal.prisma.shopping_mall_orders.findUnique({
    where: { id: orderId },
    select: { shopping_mall_memberuser_id: true },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.shopping_mall_memberuser_id !== sellerUser.id) {
    throw new Error("Unauthorized to update delivery for this order");
  }

  const updated = await MyGlobal.prisma.shopping_mall_deliveries.update({
    where: { id: deliveryId },
    data: {
      delivery_status: body.delivery_status ?? undefined,
      delivery_stage: body.delivery_stage ?? undefined,
      expected_delivery_date:
        body.expected_delivery_date === null
          ? null
          : body.expected_delivery_date
            ? toISOStringSafe(body.expected_delivery_date)
            : undefined,
      start_time:
        body.start_time === null
          ? null
          : body.start_time
            ? toISOStringSafe(body.start_time)
            : undefined,
      end_time:
        body.end_time === null
          ? null
          : body.end_time
            ? toISOStringSafe(body.end_time)
            : undefined,
      updated_at: toISOStringSafe(new Date()),
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
