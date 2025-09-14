import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallPayment } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallPayment";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Update an existing payment application for an order.
 *
 * This operation modifies payment status, amount, method, and transaction
 * details. Only authorized admin users can perform this operation.
 *
 * @param props - Object containing adminUser payload, orderId, paymentId, and
 *   the update body.
 * @param props.adminUser - Authorized admin user performing the update.
 * @param props.orderId - UUID of the order associated with the payment.
 * @param props.paymentId - UUID of the payment to update.
 * @param props.body - Partial payment details to update.
 * @returns The updated payment application data conforming to
 *   IShoppingMallPayment.
 * @throws {Error} Throws "Unauthorized" if admin user is not authorized or
 *   inactive.
 * @throws {Error} Throws "Payment not found" if payment record does not exist.
 */
export async function put__shoppingMall_adminUser_orders_$orderId_payments_$paymentId(props: {
  adminUser: AdminuserPayload;
  orderId: string & tags.Format<"uuid">;
  paymentId: string & tags.Format<"uuid">;
  body: IShoppingMallPayment.IUpdate;
}): Promise<IShoppingMallPayment> {
  const { adminUser, orderId, paymentId, body } = props;

  const admin = await MyGlobal.prisma.shopping_mall_adminusers.findFirst({
    where: {
      id: adminUser.id,
      status: "active",
      deleted_at: null,
    },
  });
  if (!admin) throw new Error("Unauthorized");

  const payment = await MyGlobal.prisma.shopping_mall_payments.findFirst({
    where: {
      id: paymentId,
      shopping_mall_order_id: orderId,
    },
  });
  if (!payment) throw new Error("Payment not found");

  const now = toISOStringSafe(new Date());

  const updated = await MyGlobal.prisma.shopping_mall_payments.update({
    where: {
      id: paymentId,
    },
    data: {
      shopping_mall_order_id: body.shopping_mall_order_id ?? undefined,
      payment_method: body.payment_method ?? undefined,
      payment_status: body.payment_status ?? undefined,
      payment_amount: body.payment_amount ?? undefined,
      transaction_id:
        body.transaction_id === null
          ? null
          : (body.transaction_id ?? undefined),
      cancelled_at:
        body.cancelled_at === null ? null : (body.cancelled_at ?? undefined),
      updated_at: now,
    },
  });

  return {
    id: updated.id,
    shopping_mall_order_id: updated.shopping_mall_order_id as string &
      tags.Format<"uuid">,
    payment_method: updated.payment_method,
    payment_status: updated.payment_status,
    payment_amount: updated.payment_amount,
    transaction_id: updated.transaction_id ?? null,
    created_at: toISOStringSafe(updated.created_at),
    updated_at: toISOStringSafe(updated.updated_at),
    cancelled_at: updated.cancelled_at
      ? toISOStringSafe(updated.cancelled_at)
      : null,
  };
}
