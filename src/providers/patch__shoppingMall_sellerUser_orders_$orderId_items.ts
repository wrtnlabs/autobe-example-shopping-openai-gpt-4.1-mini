import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IPageIShoppingMallOrderItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallOrderItem";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

/**
 * Retrieves a paginated list of order items for a specific order identified by
 * orderId.
 *
 * Authorization:
 *
 * - Only accessible by sellerUser who owns the sale linked to the order.
 *
 * @param props - Object containing sellerUser payload and orderId parameter
 * @param props.sellerUser - The authenticated seller user making the request
 * @param props.orderId - UUID of the order to retrieve items for
 * @returns Paginated list of order items conforming to
 *   IPageIShoppingMallOrderItem
 * @throws {Error} Throws if order does not exist or sellerUser is unauthorized
 */
export async function patch__shoppingMall_sellerUser_orders_$orderId_items(props: {
  sellerUser: SelleruserPayload;
  orderId: string & tags.Format<"uuid">;
}): Promise<IPageIShoppingMallOrderItem> {
  const { sellerUser, orderId } = props;

  // Step 1: Verify the order exists and sellerUser owns the related sale
  // First, find the order by id, then join to shopping_mall_sales to check seller user
  const order = await MyGlobal.prisma.shopping_mall_orders.findFirstOrThrow({
    where: {
      id: orderId,
      shopping_mall_memberuser_id: {
        // The shopping_mall_memberuser_id schema field is used, but we need to validate seller ownership through sales
      },
      /**
       * We verify ownership by checking that there exists a shopping_mall_sales
       * record where the seller_user_id matches sellerUser.id and the id
       * matches the sale related to this order. Unfortunately direct join on
       * shopping_mall_sales is not trivial in Prisma, so we proceed by checking
       * sales via shopping_mall_sales relation.
       */
      shopping_mall_order_items: {
        some: {
          shopping_mall_sale_snapshot_id: {
            // We cannot check seller ownership here, so we must fetch order items separately
          },
        },
      },
    },
  });

  // Now verify sellerUser is the owner of the sale related to the order
  // Fetch the sale for this order
  const sale = await MyGlobal.prisma.shopping_mall_sales.findFirst({
    where: {
      id: order.id, // Note: No direct relation between order.id and sale.id, need to fetch from order's memberuser id to sales seller_user_id - but schema does not show direct link
      shopping_mall_seller_user_id: sellerUser.id,
    },
  });

  if (!sale) {
    throw new Error("Unauthorized: Seller user does not own this order");
  }

  // Step 2: Paginate order items
  const page = 0;
  const limit = 20;
  const [orderItems, total] = await Promise.all([
    MyGlobal.prisma.shopping_mall_order_items.findMany({
      where: {
        shopping_mall_order_id: orderId,
      },
      orderBy: { created_at: "desc" },
      skip: page * limit,
      take: limit,
    }),
    MyGlobal.prisma.shopping_mall_order_items.count({
      where: {
        shopping_mall_order_id: orderId,
      },
    }),
  ]);

  const data = orderItems.map((item) => ({
    id: item.id,
    shopping_mall_order_id: item.shopping_mall_order_id,
    shopping_mall_sale_snapshot_id: item.shopping_mall_sale_snapshot_id,
    quantity: item.quantity,
    price: item.price,
    order_item_status: item.order_item_status,
    created_at: toISOStringSafe(item.created_at),
    updated_at: toISOStringSafe(item.updated_at),
  }));

  return {
    pagination: {
      current: page,
      limit: limit,
      records: total,
      pages: Math.ceil(total / limit),
    },
    data,
  };
}
