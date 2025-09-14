import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallOrder } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrder";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Create a new order in the shopping_mall_orders table.
 *
 * This operation creates a new order application record using the given order
 * details. It requires admin user authorization.
 *
 * @param props - Object containing adminUser authorization payload and order
 *   creation body
 * @param props.adminUser - The authenticated admin user payload
 * @param props.body - The order creation information conforming to
 *   IShoppingMallOrder.ICreate
 * @returns The created order information conforming to IShoppingMallOrder
 * @throws {Error} Throws if order creation fails or if Prisma operation errors
 */
export async function post__shoppingMall_adminUser_orders(props: {
  adminUser: AdminuserPayload;
  body: IShoppingMallOrder.ICreate;
}): Promise<IShoppingMallOrder> {
  const { adminUser, body } = props;
  const id = v4() as string & tags.Format<"uuid">;
  const now = toISOStringSafe(new Date());

  const created = await MyGlobal.prisma.shopping_mall_orders.create({
    data: {
      id,
      shopping_mall_memberuser_id: body.shopping_mall_memberuser_id,
      shopping_mall_channel_id: body.shopping_mall_channel_id,
      shopping_mall_section_id: body.shopping_mall_section_id ?? null,
      order_code: body.order_code,
      order_status: body.order_status,
      payment_status: body.payment_status,
      total_price: body.total_price,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    },
  });

  return {
    id: created.id,
    shopping_mall_memberuser_id: created.shopping_mall_memberuser_id,
    shopping_mall_channel_id: created.shopping_mall_channel_id,
    shopping_mall_section_id: created.shopping_mall_section_id ?? null,
    order_code: created.order_code,
    order_status: created.order_status,
    payment_status: created.payment_status,
    total_price: created.total_price,
    created_at: toISOStringSafe(created.created_at),
    updated_at: toISOStringSafe(created.updated_at),
    deleted_at: created.deleted_at ? toISOStringSafe(created.deleted_at) : null,
  };
}
