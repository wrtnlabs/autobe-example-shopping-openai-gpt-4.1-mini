import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallCartItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCartItem";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Retrieves detailed information for a specific cart item within a member
 * user's cart.
 *
 * This function first verifies that the requesting member user owns the cart
 * identified by cartId. It then fetches the cart item identified by cartItemId
 * within that cart.
 *
 * Authorization is strictly enforced to prevent access to carts not owned by
 * the member user.
 *
 * @param props - Object containing memberUser authentication payload, cartId,
 *   and cartItemId
 * @returns IShoppingMallCartItem - The detailed cart item information
 * @throws {Error} Throws if the cart does not exist, is not owned by the member
 *   user, or if the cart item does not exist.
 */
export async function get__shoppingMall_memberUser_carts_$cartId_cartItems_$cartItemId(props: {
  memberUser: MemberuserPayload;
  cartId: string & tags.Format<"uuid">;
  cartItemId: string & tags.Format<"uuid">;
}): Promise<IShoppingMallCartItem> {
  const { memberUser, cartId, cartItemId } = props;

  const cart = await MyGlobal.prisma.shopping_mall_carts.findUnique({
    where: { id: cartId },
  });
  if (!cart || cart.member_user_id !== memberUser.id) {
    throw new Error("Unauthorized access to this cart");
  }

  const cartItem = await MyGlobal.prisma.shopping_mall_cart_items.findFirst({
    where: { id: cartItemId, shopping_cart_id: cartId },
  });

  if (!cartItem) {
    throw new Error("Cart item not found");
  }

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
