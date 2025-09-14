import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallOrderStatusHistory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrderStatusHistory";
import { IPageIShoppingMallOrderStatusHistory } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallOrderStatusHistory";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Search and retrieve paginated order status history records.
 *
 * This operation supports filtering by order ID, old status, new status, and
 * change timestamp ranges. Pagination and sorting by change date are
 * supported.
 *
 * Accessible only by admin users for compliance and auditing.
 *
 * @param props - Object containing the adminUser authentication and request
 *   body.
 * @param props.adminUser - Authenticated admin user performing the search.
 * @param props.body - Search criteria and pagination parameters.
 * @returns Paginated list of order status history records matching filters.
 * @throws Error if invalid parameters are provided.
 */
export async function patch__shoppingMall_adminUser_orderStatusHistories(props: {
  adminUser: AdminuserPayload;
  body: IShoppingMallOrderStatusHistory.IRequest;
}): Promise<IPageIShoppingMallOrderStatusHistory> {
  const { body } = props;

  const page = body.page ?? 0;
  const limit = body.limit ?? 20;
  const skip = page * limit;

  const where = {
    ...(body.order_id !== undefined &&
      body.order_id !== null && { shopping_mall_order_id: body.order_id }),
    ...(body.old_status !== undefined &&
      body.old_status !== null && { old_status: body.old_status }),
    ...(body.new_status !== undefined &&
      body.new_status !== null && { new_status: body.new_status }),
    ...((body.changed_at_from !== undefined && body.changed_at_from !== null) ||
    (body.changed_at_to !== undefined && body.changed_at_to !== null)
      ? {
          changed_at: {
            ...(body.changed_at_from !== undefined &&
              body.changed_at_from !== null && { gte: body.changed_at_from }),
            ...(body.changed_at_to !== undefined &&
              body.changed_at_to !== null && { lte: body.changed_at_to }),
          },
        }
      : {}),
  };

  const [data, count] = await Promise.all([
    MyGlobal.prisma.shopping_mall_order_status_histories.findMany({
      where,
      orderBy: { changed_at: "desc" },
      skip,
      take: limit,
    }),
    MyGlobal.prisma.shopping_mall_order_status_histories.count({ where }),
  ]);

  return {
    pagination: {
      current: Number(page),
      limit: Number(limit),
      records: count,
      pages: Math.ceil(count / limit),
    },
    data: data.map((record) => ({
      id: record.id,
      shopping_mall_order_id: record.shopping_mall_order_id,
      old_status: record.old_status,
      new_status: record.new_status,
      changed_at: toISOStringSafe(record.changed_at),
    })),
  };
}
