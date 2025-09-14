import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallPayment } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallPayment";
import { GuestuserPayload } from "../decorators/payload/GuestuserPayload";

/**
 * Creates a new payment application for a specific order by a guest user.
 *
 * This operation adds a payment record linked to the specified order ID. It
 * uses the payment details provided in the request body adhering to the
 * IShoppingMallPayment.ICreate interface.
 *
 * The function ensures UUID generation for the payment ID, timestamp management
 * for creation and updates, and proper handling of nullable transaction IDs.
 *
 * @param props - Contains guest user payload, order ID, and payment creation
 *   data
 * @param props.guestUser - Authenticated guest user information
 * @param props.orderId - UUID of the order associated with the payment
 * @param props.body - Payment creation details conforming to
 *   IShoppingMallPayment.ICreate
 * @returns Newly created payment record with all fields populated
 * @throws {Error} If database operation fails or data is invalid
 */
export async function post__shoppingMall_guestUser_orders_$orderId_payments(props: {
  guestUser: GuestuserPayload;
  orderId: string & tags.Format<"uuid">;
  body: IShoppingMallPayment.ICreate;
}): Promise<IShoppingMallPayment> {
  const { guestUser, orderId, body } = props;

  // Generate new UUID for payment ID
  const id = v4() as string & tags.Format<"uuid">;
  // Generate current timestamps
  const now = toISOStringSafe(new Date());

  // Create payment record
  const created = await MyGlobal.prisma.shopping_mall_payments.create({
    data: {
      id,
      shopping_mall_order_id: orderId,
      payment_method: body.payment_method,
      payment_status: body.payment_status,
      payment_amount: body.payment_amount,
      transaction_id: body.transaction_id ?? null,
      created_at: now,
      updated_at: now,
      cancelled_at: null,
    },
  });

  // Return created record with date conversions
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
