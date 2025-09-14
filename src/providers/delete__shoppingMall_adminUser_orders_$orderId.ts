import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Soft delete an order by ID.
 *
 * Marks the order specified by orderId as deleted by setting the deleted_at
 * timestamp. This operation requires adminUser authorization.
 *
 * @param props - Object containing adminUser and orderId.
 * @param props.adminUser - The authenticated admin user performing the
 *   deletion.
 * @param props.orderId - UUID of the order to soft delete.
 * @returns Void
 * @throws {Error} If the order does not exist.
 */
export async function delete__shoppingMall_adminUser_orders_$orderId(props: {
  adminUser: AdminuserPayload;
  orderId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { adminUser, orderId } = props;

  const order = await MyGlobal.prisma.shopping_mall_orders.findUniqueOrThrow({
    where: { id: orderId },
  });

  await MyGlobal.prisma.shopping_mall_orders.update({
    where: { id: orderId },
    data: { deleted_at: toISOStringSafe(new Date()) },
  });
}
