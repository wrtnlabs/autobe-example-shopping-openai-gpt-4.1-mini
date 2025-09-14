import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallPayment } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallPayment";
import { IPageIShoppingMallPayment } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallPayment";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * List payment applications related to a specific order.
 *
 * Retrieves paginated payment summaries for the given order ID. Supports
 * filtering by payment method, status, and creation date range.
 *
 * Accessible only by authorized admin users.
 *
 * @param props - Object containing adminUser, orderId, and filter body
 * @param props.adminUser - The authenticated admin user
 * @param props.orderId - UUID of the order to retrieve payments for
 * @param props.body - Filtering and pagination criteria
 * @returns A paginated list of payment summaries
 * @throws {Error} When database queries fail
 */
export async function patch__shoppingMall_adminUser_orders_$orderId_payments(props: {
  adminUser: AdminuserPayload;
  orderId: string & tags.Format<"uuid">;
  body: IShoppingMallPayment.IRequest;
}): Promise<IPageIShoppingMallPayment.ISummary> {
  const { adminUser, orderId, body } = props;

  const page = body.page ?? 1;
  const limit = body.limit ?? 100;

  const whereCondition = {
    shopping_mall_order_id: orderId,
    ...(body.payment_method !== undefined &&
      body.payment_method !== null && {
        payment_method: body.payment_method,
      }),
    ...(body.payment_status !== undefined &&
      body.payment_status !== null && {
        payment_status: body.payment_status,
      }),
    ...((body.created_at_from !== undefined && body.created_at_from !== null) ||
    (body.created_at_to !== undefined && body.created_at_to !== null)
      ? {
          created_at: {
            ...(body.created_at_from !== undefined &&
              body.created_at_from !== null && {
                gte: body.created_at_from,
              }),
            ...(body.created_at_to !== undefined &&
              body.created_at_to !== null && {
                lte: body.created_at_to,
              }),
          },
        }
      : {}),
  };

  const [results, total] = await Promise.all([
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
    MyGlobal.prisma.shopping_mall_payments.count({
      where: whereCondition,
    }),
  ]);

  return {
    pagination: {
      current: Number(page),
      limit: Number(limit),
      records: total,
      pages: Math.ceil(total / limit),
    },
    data: results.map((item) => ({
      id: item.id,
      payment_method: item.payment_method,
      payment_status: item.payment_status,
      payment_amount: item.payment_amount,
      created_at: toISOStringSafe(item.created_at),
    })),
  };
}
