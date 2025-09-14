import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallPayment } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallPayment";
import { GuestuserPayload } from "../decorators/payload/GuestuserPayload";

/**
 * Get specific payment application details by orderId and paymentId.
 *
 * Retrieves detailed payment information associated with a specific order and
 * payment IDs. Verifies that the payment belongs to the order, and that the
 * order belongs to the authorizing guest user.
 *
 * @param props - Object containing guestUser payload and identifiers
 * @param props.guestUser - The authenticated guest user payload
 * @param props.orderId - UUID of the order to query
 * @param props.paymentId - UUID of the payment to retrieve
 * @returns Detailed payment information conforming to IShoppingMallPayment
 * @throws {Error} If the payment or order does not exist or does not belong to
 *   the guest user
 */
export async function get__shoppingMall_guestUser_orders_$orderId_payments_$paymentId(props: {
  guestUser: GuestuserPayload;
  orderId: string & tags.Format<"uuid">;
  paymentId: string & tags.Format<"uuid">;
}): Promise<IShoppingMallPayment> {
  const { guestUser, orderId, paymentId } = props;

  const payment = await MyGlobal.prisma.shopping_mall_payments.findFirstOrThrow(
    {
      where: {
        id: paymentId,
        shopping_mall_order_id: orderId,
        order: {
          shopping_mall_memberuser_id: guestUser.id,
          deleted_at: null,
        },
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
