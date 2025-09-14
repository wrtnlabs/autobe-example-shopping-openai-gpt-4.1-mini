import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallDelivery } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallDelivery";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

export async function get__shoppingMall_sellerUser_orders_$orderId_deliveries_$deliveryId(props: {
  sellerUser: SelleruserPayload;
  orderId: string & tags.Format<"uuid">;
  deliveryId: string & tags.Format<"uuid">;
}): Promise<IShoppingMallDelivery> {
  const { sellerUser, orderId, deliveryId } = props;

  const order = await MyGlobal.prisma.shopping_mall_orders.findFirst({
    where: {
      id: orderId,
      deleted_at: null,
    },
    select: {
      id: true,
      shopping_mall_memberuser_id: true,
      shopping_mall_channel_id: true,
      shopping_mall_section_id: true,
      order_code: true,
      order_status: true,
      payment_status: true,
      total_price: true,
    },
  });

  if (!order) throw new Error("Order does not exist or is deleted");

  const sale = await MyGlobal.prisma.shopping_mall_sales.findFirst({
    where: {
      shopping_mall_seller_user_id: sellerUser.id,
      shopping_mall_channel_id: order.shopping_mall_channel_id,
      shopping_mall_section_id: order.shopping_mall_section_id ?? undefined,
      deleted_at: null,
    },
  });

  if (!sale)
    throw new Error(
      "Unauthorized: The seller user does not own any sale in this order's channel and section",
    );

  const delivery = await MyGlobal.prisma.shopping_mall_deliveries.findFirst({
    where: {
      id: deliveryId,
      shopping_mall_order_id: orderId,
    },
  });

  if (!delivery)
    throw new Error("Delivery not found or does not belong to the order");

  return {
    id: delivery.id,
    shopping_mall_order_id: delivery.shopping_mall_order_id,
    delivery_status: delivery.delivery_status,
    delivery_stage: delivery.delivery_stage,
    expected_delivery_date: delivery.expected_delivery_date
      ? toISOStringSafe(delivery.expected_delivery_date)
      : null,
    start_time: delivery.start_time
      ? toISOStringSafe(delivery.start_time)
      : null,
    end_time: delivery.end_time ? toISOStringSafe(delivery.end_time) : null,
    created_at: toISOStringSafe(delivery.created_at),
    updated_at: toISOStringSafe(delivery.updated_at),
  };
}
