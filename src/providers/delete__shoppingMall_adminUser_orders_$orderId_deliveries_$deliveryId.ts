import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Remove a delivery record from an order.
 *
 * This endpoint permanently deletes shipment tracking data related to a
 * delivery record in a specified order. It requires an authenticated admin user
 * with proper permissions.
 *
 * @param props - The request properties including admin user and path
 *   parameters.
 * @param props.adminUser - The authenticated admin user performing the
 *   deletion.
 * @param props.orderId - Unique ID of the order containing the delivery.
 * @param props.deliveryId - Unique ID of the delivery record to delete.
 * @throws {Error} Throws if the delivery record does not exist or is not linked
 *   to the given order.
 */
export async function delete__shoppingMall_adminUser_orders_$orderId_deliveries_$deliveryId(props: {
  adminUser: AdminuserPayload;
  orderId: string & tags.Format<"uuid">;
  deliveryId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { adminUser, orderId, deliveryId } = props;

  // Verify delivery exists and belongs to the order
  await MyGlobal.prisma.shopping_mall_deliveries.findFirstOrThrow({
    where: { id: deliveryId, shopping_mall_order_id: orderId },
  });

  // Perform hard delete
  await MyGlobal.prisma.shopping_mall_deliveries.delete({
    where: { id: deliveryId },
  });
}
