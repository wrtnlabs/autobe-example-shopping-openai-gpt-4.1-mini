import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { GuestuserPayload } from "../decorators/payload/GuestuserPayload";

/**
 * Soft delete an order by ID
 *
 * This function marks an order as deleted by setting its deleted_at timestamp.
 * It enforces authorization ensuring only the guestUser who owns the order can
 * perform this operation.
 *
 * @param props - Object containing the authenticated guestUser and orderId to
 *   delete
 * @param props.guestUser - The authenticated guest user performing the deletion
 * @param props.orderId - Unique identifier of the order to delete
 * @returns Void
 * @throws {Error} When the order does not exist
 * @throws {Error} When the guest user is not authorized to delete the order
 */
export async function delete__shoppingMall_guestUser_orders_$orderId(props: {
  guestUser: GuestuserPayload;
  orderId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { guestUser, orderId } = props;

  const order = await MyGlobal.prisma.shopping_mall_orders.findUniqueOrThrow({
    where: { id: orderId },
  });

  if (order.shopping_mall_memberuser_id !== guestUser.id) {
    throw new Error("Unauthorized: You can only delete your own orders");
  }

  await MyGlobal.prisma.shopping_mall_orders.update({
    where: { id: orderId },
    data: { deleted_at: toISOStringSafe(new Date()) },
  });
}
