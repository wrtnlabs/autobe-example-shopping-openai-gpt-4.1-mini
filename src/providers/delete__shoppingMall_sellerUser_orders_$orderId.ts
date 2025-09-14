import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

/**
 * Soft delete an order specified by orderId, marking it as deleted without
 * physical removal.
 *
 * This operation is restricted to authenticated seller users. The function sets
 * the deleted_at timestamp to the current time in ISO 8601 format.
 *
 * @param props - Object containing the authenticated seller user and the order
 *   ID to delete.
 * @param props.sellerUser - The authenticated seller user performing the
 *   deletion.
 * @param props.orderId - The UUID of the order to be soft deleted.
 * @throws {Error} Throws if the order does not exist or is already deleted.
 */
export async function delete__shoppingMall_sellerUser_orders_$orderId(props: {
  sellerUser: SelleruserPayload;
  orderId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { sellerUser, orderId } = props;

  // Find the order that is not deleted
  const order = await MyGlobal.prisma.shopping_mall_orders.findFirst({
    where: {
      id: orderId,
      deleted_at: null,
    },
  });

  if (!order) throw new Error("Order not found or already deleted");

  // Prepare the soft delete timestamp
  const now: string & tags.Format<"date-time"> = toISOStringSafe(new Date());

  // Perform the soft delete by updating deleted_at
  await MyGlobal.prisma.shopping_mall_orders.update({
    where: { id: orderId },
    data: { deleted_at: now },
  });
}
