import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallPayment } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallPayment";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

export async function put__shoppingMall_sellerUser_orders_$orderId_payments_$paymentId(props: {
  sellerUser: SelleruserPayload;
  orderId: string & tags.Format<"uuid">;
  paymentId: string & tags.Format<"uuid">;
  body: IShoppingMallPayment.IUpdate;
}): Promise<IShoppingMallPayment> {
  const { sellerUser, orderId, paymentId, body } = props;

  const payment =
    await MyGlobal.prisma.shopping_mall_payments.findUniqueOrThrow({
      where: { id: paymentId },
      select: {
        id: true,
        shopping_mall_order_id: true,
        payment_method: true,
        payment_status: true,
        payment_amount: true,
        transaction_id: true,
        cancelled_at: true,
        created_at: true,
        updated_at: true,
      },
    });

  const order = await MyGlobal.prisma.shopping_mall_orders.findUniqueOrThrow({
    where: { id: orderId },
    select: {
      id: true,
      shopping_mall_memberuser_id: true,
    },
  });

  if (order.shopping_mall_memberuser_id !== sellerUser.id) {
    throw new Error("Unauthorized: sellerUser does not own this order");
  }

  const now = toISOStringSafe(new Date());

  const updated = await MyGlobal.prisma.shopping_mall_payments.update({
    where: { id: paymentId },
    data: {
      ...(body.shopping_mall_order_id !== undefined &&
        body.shopping_mall_order_id !== null && {
          shopping_mall_order_id: body.shopping_mall_order_id,
        }),
      ...(body.payment_method !== undefined &&
        body.payment_method !== null && {
          payment_method: body.payment_method,
        }),
      ...(body.payment_status !== undefined &&
        body.payment_status !== null && {
          payment_status: body.payment_status,
        }),
      ...(body.payment_amount !== undefined &&
        body.payment_amount !== null && {
          payment_amount: body.payment_amount,
        }),
      transaction_id:
        body.transaction_id === null
          ? null
          : (body.transaction_id ?? undefined),
      cancelled_at:
        body.cancelled_at === null ? null : (body.cancelled_at ?? undefined),
      updated_at: now,
    },
  });

  return {
    id: updated.id,
    shopping_mall_order_id: updated.shopping_mall_order_id as string &
      tags.Format<"uuid">,
    payment_method: updated.payment_method,
    payment_status: updated.payment_status,
    payment_amount: updated.payment_amount,
    transaction_id:
      updated.transaction_id === null
        ? null
        : (updated.transaction_id ?? undefined),
    created_at: toISOStringSafe(updated.created_at),
    updated_at: toISOStringSafe(updated.updated_at),
    cancelled_at:
      updated.cancelled_at === null
        ? null
        : updated.cancelled_at
          ? toISOStringSafe(updated.cancelled_at)
          : undefined,
  };
}
