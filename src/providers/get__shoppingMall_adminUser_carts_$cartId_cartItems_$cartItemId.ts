import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallCartItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCartItem";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Retrieve a specific cart item by ID within a cart
 *
 * This operation retrieves detailed information about a shopping cart item
 * identified by cartItemId in the cart identified by cartId. It returns
 * quantity, unit price, product snapshot reference, status, and audit
 * timestamps. Throws a 404 error if the cart item is not found or does not
 * belong to the specified cart.
 *
 * @param props - Object containing the authenticated admin user and the
 *   identifiers for cart and cart item
 * @param props.adminUser - The authenticated admin user making the request
 * @param props.cartId - UUID of the cart containing the item
 * @param props.cartItemId - UUID of the cart item to retrieve
 * @returns Detailed cart item information conforming to IShoppingMallCartItem
 * @throws {Error} Throws error if cart item not found or does not belong to the
 *   cart
 */
export async function get__shoppingMall_adminUser_carts_$cartId_cartItems_$cartItemId(props: {
  adminUser: AdminuserPayload;
  cartId: string & tags.Format<"uuid">;
  cartItemId: string & tags.Format<"uuid">;
}): Promise<IShoppingMallCartItem> {
  const { cartId, cartItemId } = props;

  const cartItem =
    await MyGlobal.prisma.shopping_mall_cart_items.findFirstOrThrow({
      where: {
        id: cartItemId,
        shopping_cart_id: cartId,
        deleted_at: null,
      },
    });

  return {
    id: cartItem.id,
    shopping_cart_id: cartItem.shopping_cart_id,
    shopping_sale_snapshot_id: cartItem.shopping_sale_snapshot_id,
    quantity: cartItem.quantity,
    unit_price: cartItem.unit_price,
    created_at: toISOStringSafe(cartItem.created_at),
    updated_at: toISOStringSafe(cartItem.updated_at),
    deleted_at: cartItem.deleted_at
      ? toISOStringSafe(cartItem.deleted_at)
      : null,
    status: cartItem.status,
  };
}
