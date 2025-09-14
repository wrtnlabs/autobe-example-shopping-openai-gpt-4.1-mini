import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallPayment } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallPayment";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Create a new payment for an order.
 *
 * Adds a payment application to a specific order. Authorized member users can
 * submit payment information for the order. Supports multiple payment methods
 * and amount validation.
 *
 * References the shopping_mall_payments table for insert operations.
 *
 * Returns the full payment application information on success.
 *
 * @param props - Object containing memberUser auth, orderId path parameter and
 *   payment create body
 * @param props.memberUser - Authenticated member user performing the operation
 * @param props.orderId - Unique identifier of the order
 * @param props.body - Payment details for creation
 * @returns The newly created payment record with full details
 * @throws {Error} When the orderId path parameter does not match the order id
 *   in the request body
 */
export async function post__shoppingMall_memberUser_orders_$orderId_payments(props: {
  memberUser: MemberuserPayload;
  orderId: string & tags.Format<"uuid">;
  body: IShoppingMallPayment.ICreate;
}): Promise<IShoppingMallPayment> {
  const { memberUser, orderId, body } = props;

  if (orderId !== body.shopping_mall_order_id) {
    throw new Error("Order ID in path does not match order ID in body");
  }

  const now = toISOStringSafe(new Date());

  const created = await MyGlobal.prisma.shopping_mall_payments.create({
    data: {
      id: v4() as string & tags.Format<"uuid">,
      shopping_mall_order_id: body.shopping_mall_order_id,
      payment_method: body.payment_method,
      payment_status: body.payment_status,
      payment_amount: body.payment_amount,
      transaction_id: body.transaction_id ?? null,
      created_at: now,
      updated_at: now,
      cancelled_at: null,
    },
  });

  return {
    id: created.id,
    shopping_mall_order_id: created.shopping_mall_order_id,
    payment_method: created.payment_method,
    payment_status: created.payment_status,
    payment_amount: created.payment_amount,
    transaction_id: created.transaction_id ?? null,
    created_at: toISOStringSafe(created.created_at),
    updated_at: toISOStringSafe(created.updated_at),
    cancelled_at: created.cancelled_at
      ? toISOStringSafe(created.cancelled_at)
      : null,
  };
}
