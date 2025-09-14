import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallPayment } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallPayment";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Get specific payment application details by orderId and paymentId.
 *
 * Retrieves detailed payment application information linked to the provided
 * order and payment IDs. Ensures the member user owns the order to prevent
 * unauthorized access.
 *
 * @param props - Object containing the memberUser authentication payload and
 *   the orderId and paymentId path parameters.
 * @returns The full payment record conforming to IShoppingMallPayment.
 * @throws {Error} When the order is not found or not owned by the memberUser.
 * @throws {Error} When the payment is not found linked to the order.
 */
export async function get__shoppingMall_memberUser_orders_$orderId_payments_$paymentId(props: {
  memberUser: MemberuserPayload;
  orderId: string & tags.Format<"uuid">;
  paymentId: string & tags.Format<"uuid">;
}): Promise<IShoppingMallPayment> {
  const { memberUser, orderId, paymentId } = props;

  // Validate order ownership and existence
  const order = await MyGlobal.prisma.shopping_mall_orders.findFirst({
    where: {
      id: orderId,
      shopping_mall_memberuser_id: memberUser.id,
      deleted_at: null,
    },
  });

  if (!order) {
    throw new Error("Order not found or unauthorized");
  }

  // Retrieve the payment linked to the order
  const payment = await MyGlobal.prisma.shopping_mall_payments.findFirst({
    where: {
      id: paymentId,
      shopping_mall_order_id: orderId,
    },
  });

  if (!payment) {
    throw new Error("Payment not found");
  }

  // Return payment details with ISO string dates
  return {
    id: payment.id,
    shopping_mall_order_id: payment.shopping_mall_order_id,
    payment_method: payment.payment_method,
    payment_status: payment.payment_status,
    payment_amount: payment.payment_amount,
    transaction_id: payment.transaction_id ?? null,
    created_at: toISOStringSafe(payment.created_at),
    updated_at: toISOStringSafe(payment.updated_at),
    cancelled_at: payment.cancelled_at
      ? toISOStringSafe(payment.cancelled_at)
      : null,
  };
}
