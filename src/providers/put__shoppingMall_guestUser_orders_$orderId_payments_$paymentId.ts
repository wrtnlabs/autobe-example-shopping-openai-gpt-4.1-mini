import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallPayment } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallPayment";
import { GuestuserPayload } from "../decorators/payload/GuestuserPayload";

export async function put__shoppingMall_guestUser_orders_$orderId_payments_$paymentId(props: {
  guestUser: GuestuserPayload;
  orderId: string & tags.Format<"uuid">;
  paymentId: string & tags.Format<"uuid">;
  body: IShoppingMallPayment.IUpdate;
}): Promise<IShoppingMallPayment> {
  const { guestUser, orderId, paymentId, body } = props;

  const payment = await MyGlobal.prisma.shopping_mall_payments.findFirst({
    where: {
      id: paymentId,
      shopping_mall_order_id: orderId,
      order: {
        guestuser_id: guestUser.id,
      },
    },
  });

  if (!payment) throw new Error("Payment not found or unauthorized");

  const updated = await MyGlobal.prisma.shopping_mall_payments.update({
    where: { id: paymentId },
    data: {
      shopping_mall_order_id: body.shopping_mall_order_id ?? undefined,
      payment_method: body.payment_method ?? undefined,
      payment_status: body.payment_status ?? undefined,
      payment_amount: body.payment_amount ?? undefined,
      transaction_id: body.transaction_id ?? null,
      cancelled_at: body.cancelled_at ?? null,
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
