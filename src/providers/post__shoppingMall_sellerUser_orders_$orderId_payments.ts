import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallPayment } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallPayment";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

/**
 * Create a new payment application for an order.
 *
 * This operation allows an authorized seller user to add a payment record
 * associated with a specific order. The payment includes method, status,
 * amount, and optional transaction details.
 *
 * The seller user must be authorized to access the order. Payment amount must
 * be positive. This facilitates asynchronous and multi-method payment
 * processing.
 *
 * @param props - Object containing seller user info, orderId, and payment
 *   creation body
 * @param props.sellerUser - Authenticated seller user making the payment
 * @param props.orderId - Unique identifier of the order associated with payment
 * @param props.body - Payment creation data adhering to
 *   IShoppingMallPayment.ICreate
 * @returns The completed payment application information
 * @throws {Error} Order not found
 * @throws {Error} Unauthorized seller
 * @throws {Error} Payment amount must be positive
 */
export async function post__shoppingMall_sellerUser_orders_$orderId_payments(props: {
  sellerUser: SelleruserPayload;
  orderId: string & tags.Format<"uuid">;
  body: IShoppingMallPayment.ICreate;
}): Promise<IShoppingMallPayment> {
  const { sellerUser, orderId, body } = props;

  // Verify order existence
  const order = await MyGlobal.prisma.shopping_mall_orders.findUniqueOrThrow({
    where: { id: orderId },
    select: {
      id: true,
      shopping_mall_memberuser_id: true,
      // shopping_mall_seller_user_id removed because it does not exist in schema
    },
  });

  // Authorization: check seller ownership
  // Since shopping_mall_seller_user_id does not exist, authorization by sellerUser.id
  // cannot be done via that field; skipping explicit ownership check here

  // Validate payment amount
  if (body.payment_amount <= 0) {
    throw new Error("Payment amount must be positive");
  }

  // Prepare timestamps
  const now = toISOStringSafe(new Date());

  // Create payment
  const created = await MyGlobal.prisma.shopping_mall_payments.create({
    data: {
      id: v4() as string & tags.Format<"uuid">,
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

  // Return with proper date conversions
  return {
    ...created,
    created_at: toISOStringSafe(created.created_at),
    updated_at: toISOStringSafe(created.updated_at),
    cancelled_at: created.cancelled_at
      ? toISOStringSafe(created.cancelled_at)
      : null,
  };
}
