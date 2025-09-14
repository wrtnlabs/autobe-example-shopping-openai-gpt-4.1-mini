import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallPayment } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallPayment";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

/**
 * Get specific payment application details by orderId and paymentId.
 *
 * Retrieves detailed payment information linked to the given order and payment
 * IDs. Authorization is performed via the provided sellerUser payload. Throws
 * an error if the payment is not found or access is denied.
 *
 * @param props - Object containing sellerUser payload and path parameters.
 * @param props.sellerUser - Authenticated seller user making the request.
 * @param props.orderId - UUID of the order linked to the payment.
 * @param props.paymentId - UUID of the payment record.
 * @returns The payment details as an IShoppingMallPayment object.
 * @throws {Error} If the payment record does not exist or is inaccessible.
 */
export async function get__shoppingMall_sellerUser_orders_$orderId_payments_$paymentId(props: {
  sellerUser: SelleruserPayload;
  orderId: string & tags.Format<"uuid">;
  paymentId: string & tags.Format<"uuid">;
}): Promise<IShoppingMallPayment> {
  const { sellerUser, orderId, paymentId } = props;

  const payment = await MyGlobal.prisma.shopping_mall_payments.findFirst({
    where: {
      id: paymentId,
      shopping_mall_order_id: orderId,
    },
  });

  if (!payment) throw new Error("Payment not found or access denied");

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
