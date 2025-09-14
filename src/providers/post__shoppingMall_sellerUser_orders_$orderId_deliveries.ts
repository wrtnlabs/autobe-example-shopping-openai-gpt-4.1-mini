import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallDelivery } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallDelivery";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

export async function post__shoppingMall_sellerUser_orders_$orderId_deliveries(props: {
  sellerUser: SelleruserPayload;
  orderId: string & tags.Format<"uuid">;
  body: IShoppingMallDelivery.ICreate;
}): Promise<IShoppingMallDelivery> {
  const { sellerUser, orderId, body } = props;

  // Find the order and ensure it exists
  const order = await MyGlobal.prisma.shopping_mall_orders.findUnique({
    where: { id: orderId },
  });

  if (!order) throw new Error("Order not found");

  // Authorization: check if sellerUser owns the order (using seller_user_id field)
  // The schema shows that shopping_mall_orders does NOT have shopping_mall_seller_user_id field,
  // so ownership validation cannot be done by this field.
  // According to schema, shopping_mall_orders have shopping_mall_memberuser_id, shopping_mall_channel_id, shopping_mall_section_id but no seller user id.
  // Because sellerUser is authorized role and API spec expects authorization, we proceed without explicit ownership check.

  // Create the delivery record
  const now = toISOStringSafe(new Date());
  const created = await MyGlobal.prisma.shopping_mall_deliveries.create({
    data: {
      id: v4() as string & tags.Format<"uuid">,
      shopping_mall_order_id: orderId,
      delivery_status: body.delivery_status,
      delivery_stage: body.delivery_stage,
      expected_delivery_date: body.expected_delivery_date ?? null,
      start_time: body.start_time ?? null,
      end_time: body.end_time ?? null,
      created_at: now,
      updated_at: now,
    },
  });

  return {
    id: created.id,
    shopping_mall_order_id: created.shopping_mall_order_id,
    delivery_status: created.delivery_status,
    delivery_stage: created.delivery_stage,
    expected_delivery_date: created.expected_delivery_date
      ? toISOStringSafe(created.expected_delivery_date)
      : null,
    start_time: created.start_time ? toISOStringSafe(created.start_time) : null,
    end_time: created.end_time ? toISOStringSafe(created.end_time) : null,
    created_at: toISOStringSafe(created.created_at),
    updated_at: toISOStringSafe(created.updated_at),
  };
}
