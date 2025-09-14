import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallPayment } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallPayment";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Create a new payment for an order.
 *
 * This function creates a payment record associated with a specific order,
 * using the provided payment details. It generates a UUID for the payment,
 * assigns timestamps, and handles nullable transaction IDs.
 *
 * @param props - Object containing admin user authentication, order ID, and
 *   payment data
 * @param props.adminUser - Authenticated admin user making the request
 * @param props.orderId - Unique identifier of the order to apply the payment
 * @param props.body - Payment creation data conforming to
 *   IShoppingMallPayment.ICreate
 * @returns The newly created payment record including all fields
 * @throws {Error} If creation fails or database operation fails
 */
export async function post__shoppingMall_adminUser_orders_$orderId_payments(props: {
  adminUser: AdminuserPayload;
  orderId: string & tags.Format<"uuid">;
  body: IShoppingMallPayment.ICreate;
}): Promise<IShoppingMallPayment> {
  const now = toISOStringSafe(new Date());
  const id = v4() as string & tags.Format<"uuid">;

  const payment = await MyGlobal.prisma.shopping_mall_payments.create({
    data: {
      id,
      shopping_mall_order_id: props.orderId,
      payment_method: props.body.payment_method,
      payment_status: props.body.payment_status,
      payment_amount: props.body.payment_amount,
      transaction_id: props.body.transaction_id ?? null,
      created_at: now,
      updated_at: now,
      cancelled_at: null,
    },
  });

  return {
    id: payment.id,
    shopping_mall_order_id: payment.shopping_mall_order_id,
    payment_method: payment.payment_method,
    payment_status: payment.payment_status,
    payment_amount: payment.payment_amount,
    transaction_id: payment.transaction_id,
    created_at: toISOStringSafe(payment.created_at),
    updated_at: toISOStringSafe(payment.updated_at),
    cancelled_at: payment.cancelled_at
      ? toISOStringSafe(payment.cancelled_at)
      : null,
  };
}
