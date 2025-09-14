import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallOrder } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrder";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

/**
 * Get detailed information for a specific order.
 *
 * Retrieves an order by orderId, ensuring that the requesting seller user owns
 * at least one sale product linked to the order's channel. Throws an error if
 * the order is not found or if the user is unauthorized.
 *
 * @param props - Object containing sellerUser payload and orderId path
 *   parameter.
 * @param props.sellerUser - The authenticated seller user making the request.
 * @param props.orderId - The UUID of the order to retrieve.
 * @returns The detailed shopping mall order information.
 * @throws {Error} When the order is not found.
 * @throws {Error} When the seller user is not authorized to access this order.
 */
export async function get__shoppingMall_sellerUser_orders_$orderId(props: {
  sellerUser: SelleruserPayload;
  orderId: string & tags.Format<"uuid">;
}): Promise<IShoppingMallOrder> {
  const { sellerUser, orderId } = props;

  const order = await MyGlobal.prisma.shopping_mall_orders.findUnique({
    where: { id: orderId },
  });
  if (!order) throw new Error("Order not found");

  const hasAuthorizedSale = await MyGlobal.prisma.shopping_mall_sales.findFirst(
    {
      where: {
        shopping_mall_channel_id: order.shopping_mall_channel_id,
        shopping_mall_seller_user_id: sellerUser.id,
        deleted_at: null,
      },
    },
  );

  if (!hasAuthorizedSale) {
    throw new Error("Unauthorized: You do not have access to this order");
  }

  return {
    id: order.id,
    shopping_mall_memberuser_id: order.shopping_mall_memberuser_id,
    shopping_mall_channel_id: order.shopping_mall_channel_id,
    shopping_mall_section_id: order.shopping_mall_section_id ?? null,
    order_code: order.order_code,
    order_status: order.order_status,
    payment_status: order.payment_status,
    total_price: order.total_price,
    created_at: toISOStringSafe(order.created_at),
    updated_at: toISOStringSafe(order.updated_at),
    deleted_at: order.deleted_at ? toISOStringSafe(order.deleted_at) : null,
  };
}
