import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallOrder } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrder";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Update an existing order's details.
 *
 * Authorizes roles: guestUser, memberUser, sellerUser, adminUser. Updates order
 * information identified by orderId with provided changes. Returns updated
 * order data with date strings properly formatted.
 *
 * @param props - Object containing adminUser, orderId, and update body
 * @param props.adminUser - Authenticated admin user payload
 * @param props.orderId - UUID of the order to be updated
 * @param props.body - Partial order update information
 * @returns Updated IShoppingMallOrder reflecting applied changes
 * @throws Error if order not found or update fails
 */
export async function put__shoppingMall_adminUser_orders_$orderId(props: {
  adminUser: AdminuserPayload;
  orderId: string & tags.Format<"uuid">;
  body: IShoppingMallOrder.IUpdate;
}): Promise<IShoppingMallOrder> {
  const { adminUser, orderId, body } = props;

  await MyGlobal.prisma.shopping_mall_orders.findUniqueOrThrow({
    where: { id: orderId },
  });

  const updated = await MyGlobal.prisma.shopping_mall_orders.update({
    where: { id: orderId },
    data: {
      shopping_mall_memberuser_id:
        body.shopping_mall_memberuser_id === null
          ? undefined
          : body.shopping_mall_memberuser_id,
      shopping_mall_channel_id:
        body.shopping_mall_channel_id === null
          ? undefined
          : body.shopping_mall_channel_id,
      shopping_mall_section_id: body.shopping_mall_section_id ?? undefined,
      order_code: body.order_code ?? undefined,
      order_status: body.order_status ?? undefined,
      payment_status: body.payment_status ?? undefined,
      total_price: body.total_price ?? undefined,
      deleted_at:
        body.deleted_at === null ? null : (body.deleted_at ?? undefined),
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
