import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallDelivery } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallDelivery";
import { IPageIShoppingMallDelivery } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallDelivery";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

export async function patch__shoppingMall_sellerUser_orders_$orderId_deliveries(props: {
  sellerUser: SelleruserPayload;
  orderId: string & tags.Format<"uuid">;
  body: IShoppingMallDelivery.IRequest;
}): Promise<IPageIShoppingMallDelivery.ISummary> {
  const { sellerUser, orderId, body } = props;

  // Verify the order exists
  const order = await MyGlobal.prisma.shopping_mall_orders.findUnique({
    where: { id: orderId },
    select: { id: true },
  });
  if (!order) throw new Error("Order not found");

  // Get all sale snapshot IDs from the order items of this order
  const snapshotIds = (
    await MyGlobal.prisma.shopping_mall_order_items.findMany({
      where: { shopping_mall_order_id: orderId },
      select: { shopping_mall_sale_snapshot_id: true },
    })
  ).map((item) => item.shopping_mall_sale_snapshot_id);

  if (snapshotIds.length === 0) {
    throw new Error("Unauthorized: No sales snapshots in order");
  }

  // Verify seller user owns sales related to the snapshots in the order
  const relatedSalesCount = await MyGlobal.prisma.shopping_mall_sales.count({
    where: {
      shopping_mall_seller_user_id: sellerUser.id,
      id: { in: snapshotIds },
    },
  });

  if (relatedSalesCount === 0) {
    throw new Error("Unauthorized: Seller user not linked to the order sales");
  }

  // Pagination and filtering
  const page = body.page ?? 1;
  const limit = body.limit ?? 100;
  const skip = (page - 1) * limit;

  const where = {
    shopping_mall_order_id: orderId,
    ...(body.delivery_status !== undefined &&
      body.delivery_status !== null && {
        delivery_status: body.delivery_status,
      }),
    ...(body.delivery_stage !== undefined &&
      body.delivery_stage !== null && {
        delivery_stage: body.delivery_stage,
      }),
  };

  // Determine sorting field and direction
  const validOrderFields = ["delivery_status", "delivery_stage", "created_at"];
  const orderByField = validOrderFields.includes(body.orderBy ?? "")
    ? body.orderBy
    : "created_at";
  const orderDirection =
    body.orderDirection?.toLowerCase() === "asc" ? "asc" : "desc";

  // Explicitly type orderBy with string keys is invalid, so build inline object with type assertion
  const orderBy: { [key: string]: "asc" | "desc" } = {};
  orderBy[orderByField ?? "created_at"] = orderDirection as "asc" | "desc";

  // Fetch deliveries and total count
  const [deliveries, total] = await Promise.all([
    MyGlobal.prisma.shopping_mall_deliveries.findMany({
      where,
      orderBy,
      skip,
      take: limit,
    }),
    MyGlobal.prisma.shopping_mall_deliveries.count({ where }),
  ]);

  // Map domain to API DTO
  const data = deliveries.map((d) => ({
    id: d.id,
    shopping_mall_order_id: d.shopping_mall_order_id,
    delivery_status: d.delivery_status,
    delivery_stage: d.delivery_stage,
    expected_delivery_date: d.expected_delivery_date
      ? toISOStringSafe(d.expected_delivery_date)
      : null,
    created_at: toISOStringSafe(d.created_at),
  }));

  return {
    pagination: {
      current: Number(page),
      limit: Number(limit),
      records: total,
      pages: Math.ceil(total / limit),
    },
    data,
  };
}
