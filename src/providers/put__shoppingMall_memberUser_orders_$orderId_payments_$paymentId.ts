import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallPayment } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallPayment";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Update an existing payment application for an order.
 *
 * This operation allows an authorized memberUser to update payment details,
 * such as payment method, status, amount, transaction ID, and cancellation
 * timestamp.
 *
 * Authorization: Only the memberUser who owns the order associated with the
 * payment can modify the payment.
 *
 * @param props.memberUser - The authenticated member user making the update
 *   request.
 * @param props.orderId - UUID of the order associated with the payment.
 * @param props.paymentId - UUID of the payment to update.
 * @param props.body - Partial payment update data conforming to
 *   IShoppingMallPayment.IUpdate.
 * @returns The updated payment record with all date fields formatted as ISO
 *   strings.
 * @throws {Error} When the payment is not found.
 * @throws {Error} When the member user is not authorized to update the payment.
 */
export async function put__shoppingMall_memberUser_orders_$orderId_payments_$paymentId(props: {
  memberUser: MemberuserPayload;
  orderId: string & tags.Format<"uuid">;
  paymentId: string & tags.Format<"uuid">;
  body: IShoppingMallPayment.IUpdate;
}): Promise<IShoppingMallPayment> {
  const { memberUser, orderId, paymentId, body } = props;

  // Fetch payment with order relation to verify ownership
  const payment = await MyGlobal.prisma.shopping_mall_payments.findUnique({
    where: { id: paymentId },
    include: { order: true },
  });

  if (!payment) {
    throw new Error("Payment not found");
  }

  if (
    !payment.order ||
    payment.order.shopping_mall_memberuser_id !== memberUser.id
  ) {
    throw new Error("Unauthorized: Access denied to update this payment");
  }

  // Current timestamp for updated_at
  const now = toISOStringSafe(new Date());

  const updated = await MyGlobal.prisma.shopping_mall_payments.update({
    where: { id: paymentId },
    data: {
      ...(body.shopping_mall_order_id !== undefined && {
        shopping_mall_order_id: body.shopping_mall_order_id,
      }),
      ...(body.payment_method !== undefined && {
        payment_method: body.payment_method,
      }),
      ...(body.payment_status !== undefined && {
        payment_status: body.payment_status,
      }),
      ...(body.payment_amount !== undefined && {
        payment_amount: body.payment_amount,
      }),
      ...(body.transaction_id !== undefined && {
        transaction_id: body.transaction_id,
      }),
      ...(body.cancelled_at !== undefined && {
        cancelled_at: body.cancelled_at,
      }),
      updated_at: now,
    },
  });

  return {
    id: updated.id,
    shopping_mall_order_id: updated.shopping_mall_order_id,
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
