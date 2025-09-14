import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallPayment } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallPayment";
import { IPageIShoppingMallPayment } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallPayment";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * List payment applications related to a specific order.
 *
 * Retrieve a paginated list of payment applications associated with the given
 * order ID. Supports filtering by payment method, payment status, and creation
 * date range. Results are ordered by creation date descending.
 *
 * @param props - The properties for fetching the payments.
 * @param props.memberUser - The authenticated member user requesting the
 *   payments.
 * @param props.orderId - The UUID of the order to filter payments.
 * @param props.body - The filter and pagination options.
 * @returns A paginated summary list of payments matching the criteria.
 * @throws {Error} When Prisma client operations fail.
 */
export async function patch__shoppingMall_memberUser_orders_$orderId_payments(props: {
  memberUser: {
    id: string & tags.Format<"uuid">;
    type: string;
  };
  orderId: string & tags.Format<"uuid">;
  body: {
    page?: (number & tags.Type<"int32">) | null | undefined;
    limit?: (number & tags.Type<"int32">) | null | undefined;
    payment_method?: string | null | undefined;
    payment_status?: string | null | undefined;
    created_at_from?: (string & tags.Format<"date-time">) | null | undefined;
    created_at_to?: (string & tags.Format<"date-time">) | null | undefined;
  };
}): Promise<IPageIShoppingMallPayment.ISummary> {
  const { memberUser, orderId, body } = props;

  const page = body.page ?? 1;
  const limit = body.limit ?? 100;

  const whereCondition = {
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

  const [payments, total] = await Promise.all([
    MyGlobal.prisma.shopping_mall_payments.findMany({
      where: whereCondition,
      orderBy: { created_at: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        payment_method: true,
        payment_status: true,
        payment_amount: true,
        created_at: true,
      },
    }),
    MyGlobal.prisma.shopping_mall_payments.count({ where: whereCondition }),
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
