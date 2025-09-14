import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Delete a cart item by ID within a cart.
 *
 * This operation removes a specific cart item identified by cartItemId from the
 * specified shopping cart. It performs a soft delete by setting the deleted_at
 * timestamp.
 *
 * Authorization: Only the member user who owns the cart can perform this
 * operation.
 *
 * @param props - Object containing memberUser payload and cart/cartItem IDs
 * @param props.memberUser - The authenticated member user performing the
 *   deletion
 * @param props.cartId - UUID of the cart containing the item
 * @param props.cartItemId - UUID of the cart item to delete
 * @throws {Error} When cart is not found
 * @throws {Error} When the authenticated member user does not own the cart
 * @throws {Error} When the cart item is not found in the cart
 */
export async function delete__shoppingMall_memberUser_carts_$cartId_cartItems_$cartItemId(props: {
  memberUser: MemberuserPayload;
  cartId: string & tags.Format<"uuid">;
  cartItemId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { memberUser, cartId, cartItemId } = props;

  const cart = await MyGlobal.prisma.shopping_mall_carts.findUnique({
    where: { id: cartId },
  });
  if (!cart) throw new Error("Cart not found");

  if (cart.member_user_id !== memberUser.id) {
    throw new Error("Unauthorized: You can only modify your own cart");
  }

  const cartItem = await MyGlobal.prisma.shopping_mall_cart_items.findUnique({
    where: { id: cartItemId },
  });
  if (!cartItem || cartItem.shopping_cart_id !== cartId) {
    throw new Error("Cart item not found");
  }

  await MyGlobal.prisma.shopping_mall_cart_items.update({
    where: { id: cartItemId },
    data: { deleted_at: toISOStringSafe(new Date()) },
  });

  await MyGlobal.prisma.shopping_mall_carts.update({
    where: { id: cartId },
    data: { updated_at: toISOStringSafe(new Date()) },
  });
}
