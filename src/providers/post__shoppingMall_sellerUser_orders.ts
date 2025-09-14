import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallOrder } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrder";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

/**
 * Creates a new order application record in the shopping mall system.
 *
 * This endpoint allows an authenticated sellerUser to create a new order.
 *
 * The order includes references to the member user, channel, optional section,
 * status fields, payment status, and total price.
 *
 * Timestamps for creation and update are set internally.
 *
 * @param props - Properties containing sellerUser authentication and order
 *   creation data.
 * @param props.sellerUser - The authenticated seller user making the request.
 * @param props.body - Order creation payload containing essential order
 *   details.
 * @returns The created order record with id and timestamps.
 * @throws {Error} Throws error if database operation fails.
 */
export async function post__shoppingMall_sellerUser_orders(props: {
  sellerUser: SelleruserPayload;
  body: IShoppingMallOrder.ICreate;
}): Promise<IShoppingMallOrder> {
  const { sellerUser, body } = props;
  const now = toISOStringSafe(new Date());

  const created = await MyGlobal.prisma.shopping_mall_orders.create({
    data: {
      id: v4(),
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
