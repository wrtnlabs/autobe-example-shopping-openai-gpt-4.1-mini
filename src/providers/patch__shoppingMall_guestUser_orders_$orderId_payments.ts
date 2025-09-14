import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallPayment } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallPayment";
import { IPageIShoppingMallPayment } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallPayment";
import { GuestuserPayload } from "../decorators/payload/GuestuserPayload";

/**
 * List payment applications related to a specific order
 *
 * Retrieves paginated payment summaries for the specified order filtering by
 * payment method, payment status, and creation date range.
 *
 * Accessible only to authorized guest users.
 *
 * @param props - Object containing the guestUser authentication payload, the
 *   orderId path parameter, and filter/pagination body
 * @param props.guestUser - Authenticated guest user making the request
 * @param props.orderId - UUID string of the specific order
 * @param props.body - Filtering and pagination parameters conforming to
 *   IShoppingMallPayment.IRequest
 * @returns Paginated summary list of payment applications matching the filters
 * @throws {Error} If database errors or other unexpected errors occur
 */
export async function patch__shoppingMall_guestUser_orders_$orderId_payments(props: {
  guestUser: GuestuserPayload;
  orderId: string & tags.Format<"uuid">;
  body: IShoppingMallPayment.IRequest;
}): Promise<IPageIShoppingMallPayment.ISummary> {
  const { guestUser, orderId, body } = props;

  const where = {
    shopping_mall_order_id: orderId,
    ...(body.payment_method !== undefined &&
      body.payment_method !== null && { payment_method: body.payment_method }),
    ...(body.payment_status !== undefined &&
      body.payment_status !== null && { payment_status: body.payment_status }),
    ...((body.created_at_from !== undefined && body.created_at_from !== null) ||
    (body.created_at_to !== undefined && body.created_at_to !== null)
      ? {
          created_at: {
            ...(body.created_at_from !== undefined &&
              body.created_at_from !== null && { gte: body.created_at_from }),
            ...(body.created_at_to !== undefined &&
              body.created_at_to !== null && { lte: body.created_at_to }),
          },
        }
      : {}),
  };

  const page = body.page ?? 1;
  const limit = body.limit ?? 100;

  const [payments, total] = await Promise.all([
    MyGlobal.prisma.shopping_mall_payments.findMany({
      where,
      select: {
        id: true,
        payment_method: true,
        payment_status: true,
        payment_amount: true,
        created_at: true,
      },
      orderBy: { created_at: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),

    MyGlobal.prisma.shopping_mall_payments.count({ where }),
  ]);

  return {
    pagination: {
      current: Number(page),
      limit: Number(limit),
      records: total,
      pages: Math.ceil(total / limit),
    },
    data: payments.map((payment) => ({
      id: payment.id,
      payment_method: payment.payment_method,
      payment_status: payment.payment_status,
      payment_amount: payment.payment_amount,
      created_at: toISOStringSafe(payment.created_at),
    })),
  };
}
