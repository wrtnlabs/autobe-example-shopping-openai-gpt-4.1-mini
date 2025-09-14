import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallOrder } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrder";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Create a new order
 *
 * Creates a new order record in the shopping_mall_orders table with the
 * provided data, including member user, channel, section, order code, status,
 * payment status, total price, and timestamps. This operation requires an
 * authenticated member user.
 *
 * @param props - Properties containing the authenticated memberUser and order
 *   creation data
 * @param props.memberUser - The authenticated member user placing the order
 * @param props.body - The order creation payload conforming to
 *   IShoppingMallOrder.ICreate
 * @returns The newly created order record matching IShoppingMallOrder
 * @throws {Error} Propagates errors from Prisma client, including validation
 *   errors
 */
export async function post__shoppingMall_memberUser_orders(props: {
  memberUser: MemberuserPayload;
  body: IShoppingMallOrder.ICreate;
}): Promise<IShoppingMallOrder> {
  const { memberUser, body } = props;
  const id = v4();
  const now = toISOStringSafe(new Date());

  const created = await MyGlobal.prisma.shopping_mall_orders.create({
    data: {
      id: id,
      shopping_mall_memberuser_id: body.shopping_mall_memberuser_id,
      shopping_mall_channel_id: body.shopping_mall_channel_id,
      shopping_mall_section_id: body.shopping_mall_section_id ?? null,
      order_code: body.order_code,
      order_status: body.order_status,
      payment_status: body.payment_status,
      total_price: body.total_price,
      created_at: now,
      updated_at: now,
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
