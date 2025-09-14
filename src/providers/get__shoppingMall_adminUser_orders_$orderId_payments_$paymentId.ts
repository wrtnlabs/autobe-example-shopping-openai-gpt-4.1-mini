import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallPayment } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallPayment";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Get specific payment application details by orderId and paymentId
 *
 * Retrieves detailed information about a specific payment linked to an order by
 * order ID and payment ID. Authorized admin users can access the payment
 * details if they exist.
 *
 * @param props - Object containing admin user credentials and identifiers
 * @param props.adminUser - The authenticated admin user making the request
 * @param props.orderId - Unique identifier of the order
 * @param props.paymentId - Unique identifier of the payment
 * @returns Detailed payment application information as IShoppingMallPayment
 * @throws {Error} If the payment matching the orderId and paymentId is not
 *   found
 */
export async function get__shoppingMall_adminUser_orders_$orderId_payments_$paymentId(props: {
  adminUser: AdminuserPayload;
  orderId: string & tags.Format<"uuid">;
  paymentId: string & tags.Format<"uuid">;
}): Promise<IShoppingMallPayment> {
  const { adminUser, orderId, paymentId } = props;

  const payment = await MyGlobal.prisma.shopping_mall_payments.findFirstOrThrow(
    {
      where: {
        id: paymentId,
        shopping_mall_order_id: orderId,
      },
    },
  );

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
