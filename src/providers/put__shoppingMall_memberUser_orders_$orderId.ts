import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallOrder } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrder";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Updates an existing order identified by orderId with provided modifications.
 *
 * This operation requires authorization by a memberUser and ensures that only
 * the owner of the order can update it.
 *
 * It updates fields such as channel, section, order code, statuses, total
 * price, and handles soft deletion. Dates are handled as ISO strings with safe
 * conversion.
 *
 * @param props - Object containing memberUser authentication, orderId, and
 *   update data.
 * @param props.memberUser - Authenticated member user payload.
 * @param props.orderId - UUID of the order to update.
 * @param props.body - Partial update payload for the order.
 * @returns The updated order record with properly typed date strings.
 * @throws {Error} When the order is not found or the memberUser is
 *   unauthorized.
 */
export async function put__shoppingMall_memberUser_orders_$orderId(props: {
  memberUser: MemberuserPayload;
  orderId: string & tags.Format<"uuid">;
  body: IShoppingMallOrder.IUpdate;
}): Promise<IShoppingMallOrder> {
  const { memberUser, orderId, body } = props;

  const order = await MyGlobal.prisma.shopping_mall_orders.findUniqueOrThrow({
    where: { id: orderId },
  });

  if (order.shopping_mall_memberuser_id !== memberUser.id) {
    throw new Error("Unauthorized: You can only update your own orders");
  }

  const updated = await MyGlobal.prisma.shopping_mall_orders.update({
    where: { id: orderId },
    data: {
      shopping_mall_memberuser_id:
        body.shopping_mall_memberuser_id ?? undefined,
      shopping_mall_channel_id: body.shopping_mall_channel_id ?? undefined,
      shopping_mall_section_id: body.shopping_mall_section_id ?? undefined,
      order_code: body.order_code ?? undefined,
      order_status: body.order_status ?? undefined,
      payment_status: body.payment_status ?? undefined,
      total_price: body.total_price ?? undefined,
      deleted_at: body.deleted_at ?? undefined,
    },
  });

  return {
    id: updated.id,
    shopping_mall_memberuser_id: updated.shopping_mall_memberuser_id,
    shopping_mall_channel_id: updated.shopping_mall_channel_id,
    shopping_mall_section_id: updated.shopping_mall_section_id ?? null,
    order_code: updated.order_code,
    order_status: updated.order_status,
    payment_status: updated.payment_status,
    total_price: updated.total_price,
    created_at: toISOStringSafe(updated.created_at),
    updated_at: toISOStringSafe(updated.updated_at),
    deleted_at: updated.deleted_at ? toISOStringSafe(updated.deleted_at) : null,
  };
}
