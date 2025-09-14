import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallDelivery } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallDelivery";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

export async function get__shoppingMall_adminUser_orders_$orderId_deliveries_$deliveryId(props: {
  adminUser: AdminuserPayload;
  orderId: string & tags.Format<"uuid">;
  deliveryId: string & tags.Format<"uuid">;
}): Promise<IShoppingMallDelivery> {
  const { adminUser, orderId, deliveryId } = props;
  const delivery =
    await MyGlobal.prisma.shopping_mall_deliveries.findFirstOrThrow({
      where: {
        id: deliveryId,
        shopping_mall_order_id: orderId,
        // deleted_at does not exist in shopping_mall_deliveriesWhereInput, removed
      },
    });
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
