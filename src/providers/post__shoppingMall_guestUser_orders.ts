import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallOrder } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrder";
import { GuestuserPayload } from "../decorators/payload/GuestuserPayload";

/**
 * Creates a new order record in the shopping mall system.
 *
 * This operation handles order placement from guest users with necessary
 * details such as member user reference, channel, section, order codes,
 * statuses, total pricing, and timestamps.
 *
 * @param props - Object containing guestUser authorization payload and order
 *   creation data
 * @param props.guestUser - Authenticated guest user payload
 * @param props.body - Order creation request body
 * @returns The newly created order record with all fields
 * @throws {Error} Throws if creation fails or constraints are violated
 */
export async function post__shoppingMall_guestUser_orders(props: {
  guestUser: GuestuserPayload;
  body: IShoppingMallOrder.ICreate;
}): Promise<IShoppingMallOrder> {
  const { guestUser, body } = props;

  const now = toISOStringSafe(new Date());
  const id = v4() as string & tags.Format<"uuid">;

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
