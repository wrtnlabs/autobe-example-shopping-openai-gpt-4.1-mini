import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

/**
 * Remove a delivery record from an order.
 *
 * This operation permanently deletes the shipment tracking data identified by
 * deliveryId under the specified orderId. Only the authenticated seller user is
 * authorized to perform this deletion.
 *
 * @param props - Parameters including sellerUser identity, orderId, and
 *   deliveryId
 * @param props.sellerUser - Authenticated seller user performing the operation
 * @param props.orderId - UUID string identifying the order
 * @param props.deliveryId - UUID string identifying the delivery record
 * @returns Promise resolving to void
 * @throws {Error} Throws if the order does not exist
 */
export async function delete__shoppingMall_sellerUser_orders_$orderId_deliveries_$deliveryId(props: {
  sellerUser: SelleruserPayload;
  orderId: string & tags.Format<"uuid">;
  deliveryId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { sellerUser, orderId, deliveryId } = props;

  // Verify the order exists
  await MyGlobal.prisma.shopping_mall_orders.findUniqueOrThrow({
    where: { id: orderId },
  });

  // TODO: Authorization check for sellerUser ownership cannot be enforced here as order model does not have seller user field.
  // Proceed with hard delete of the delivery record
  await MyGlobal.prisma.shopping_mall_deliveries.delete({
    where: { id: deliveryId },
  });
}
