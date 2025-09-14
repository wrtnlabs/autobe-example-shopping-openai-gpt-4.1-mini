import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallPayment } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallPayment";
import { IPageIShoppingMallPayment } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallPayment";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

/**
 * List payment applications related to a specific order
 *
 * Retrieve list of payment applications for an order with filtering and
 * pagination. This operation returns summarized payment information to
 * authorized users.
 *
 * Links to the shopping_mall_payments database table filtered by order ID.
 *
 * Supports pagination, filtering, and status filtering.
 *
 * @param props - Object containing sellerUser payload, orderId, and request
 *   body filtering options
 * @param props.sellerUser - Authenticated seller user payload
 * @param props.orderId - Unique identifier of the target order
 * @param props.body - Filtering and pagination request body
 * @returns Paginated list of payment summaries for the order
 * @throws {Error} When database query or processing fails
 */
export async function patch__shoppingMall_sellerUser_orders_$orderId_payments(props: {
  sellerUser: SelleruserPayload;
  orderId: string & tags.Format<"uuid">;
  body: IShoppingMallPayment.IRequest;
}): Promise<IPageIShoppingMallPayment.ISummary> {
  const { sellerUser, orderId, body } = props;

  const page = body.page ?? 1;
  const limit = body.limit ?? 100;

  const where = {
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

  const [rows, total] = await Promise.all([
    MyGlobal.prisma.shopping_mall_payments.findMany({
      where,
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
    MyGlobal.prisma.shopping_mall_payments.count({ where }),
  ]);

  return {
    pagination: {
      current: Number(page),
      limit: Number(limit),
      records: total,
      pages: Math.ceil(total / limit),
    },
    data: rows.map((item) => ({
      id: item.id,
      payment_method: item.payment_method,
      payment_status: item.payment_status,
      payment_amount: item.payment_amount,
      created_at: toISOStringSafe(item.created_at),
    })),
  };
}
