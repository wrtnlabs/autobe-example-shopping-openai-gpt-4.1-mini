import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Delete a payment record for a specific order
 *
 * This operation permanently deletes the payment entry identified by the
 * paymentId under the specific orderId. Only an authorized adminUser can
 * perform this operation.
 *
 * @param props - Object containing the adminUser authorization, the orderId and
 *   paymentId identifying the payment to delete
 * @param props.adminUser - The authenticated admin user requesting deletion
 * @param props.orderId - UUID of the order that the payment belongs to
 * @param props.paymentId - UUID of the payment to be deleted
 * @throws {Error} Throws if the payment does not exist or mismatch with orderId
 * @throws {Error} Throws if the Prisma operation fails
 */
export async function delete__shoppingMall_adminUser_orders_$orderId_payments_$paymentId(props: {
  adminUser: AdminuserPayload;
  orderId: string & tags.Format<"uuid">;
  paymentId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { adminUser, orderId, paymentId } = props;

  // Verify payment exists and belongs to the order
  await MyGlobal.prisma.shopping_mall_payments.findFirstOrThrow({
    where: {
      id: paymentId,
      shopping_mall_order_id: orderId,
    },
  });

  // Perform hard delete of the payment record
  await MyGlobal.prisma.shopping_mall_payments.delete({
    where: {
      id: paymentId,
    },
  });
}
