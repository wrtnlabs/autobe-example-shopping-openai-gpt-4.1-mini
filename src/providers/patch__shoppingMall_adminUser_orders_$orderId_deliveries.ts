import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallDelivery } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallDelivery";
import { IPageIShoppingMallDelivery } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallDelivery";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

export async function patch__shoppingMall_adminUser_orders_$orderId_deliveries(props: {
  adminUser: AdminuserPayload;
  orderId: string & tags.Format<"uuid">;
  body: IShoppingMallDelivery.IRequest;
}): Promise<IPageIShoppingMallDelivery.ISummary> {
  const { adminUser, orderId, body } = props;
  const page = body.page ?? 0;
  const limit = body.limit ?? 100;

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

  const orderBy =
    body.orderBy === "created_at"
      ? ({
          created_at: body.orderDirection === "asc" ? "asc" : "desc",
        } as const)
      : ({ created_at: "desc" } as const);

  const [deliveries, total] = await Promise.all([
    MyGlobal.prisma.shopping_mall_deliveries.findMany({
      where,
      orderBy,
      skip: page * limit,
      take: limit,
      select: {
        id: true,
        shopping_mall_order_id: true,
        delivery_status: true,
        delivery_stage: true,
        expected_delivery_date: true,
        created_at: true,
      },
    }),
    MyGlobal.prisma.shopping_mall_deliveries.count({ where }),
  ]);

  return {
    pagination: {
      current: Number(page),
      limit: Number(limit),
      records: total,
      pages: Math.ceil(total / limit),
    },
    data: deliveries.map((delivery) => ({
      id: delivery.id,
      shopping_mall_order_id: delivery.shopping_mall_order_id,
      delivery_status: delivery.delivery_status,
      delivery_stage: delivery.delivery_stage,
      expected_delivery_date: delivery.expected_delivery_date
        ? toISOStringSafe(delivery.expected_delivery_date)
        : null,
      created_at: toISOStringSafe(delivery.created_at),
    })),
  };
}
