import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallCartItemOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCartItemOption";
import { GuestuserPayload } from "../decorators/payload/GuestuserPayload";

/**
 * Update a specific cart item option by ID.
 *
 * This operation updates the selected product option group and sale option for
 * a cart item option record belonging to the authenticated guest user.
 *
 * Authorization: The guestUser identified in the props must be the owner of the
 * parent cart through the cart item and cart item option associations.
 *
 * @param props -
 * @param props.guestUser - The authenticated guest user performing the update
 * @param props.cartItemId - UUID of the cart item
 * @param props.cartItemOptionId - UUID of the cart item option
 * @param props.body - Fields to update on the cart item option
 * @returns The updated cart item option record
 * @throws {Error} When the cart item option is not found
 * @throws {Error} When the cart item ID does not match the option
 * @throws {Error} When the cart item or cart is not found
 * @throws {Error} When the cart does not belong to the guest user
 */
export async function put__shoppingMall_guestUser_cartItems_$cartItemId_cartItemOptions_$cartItemOptionId(props: {
  guestUser: GuestuserPayload;
  cartItemId: string & tags.Format<"uuid">;
  cartItemOptionId: string & tags.Format<"uuid">;
  body: IShoppingMallCartItemOption.IUpdate;
}): Promise<IShoppingMallCartItemOption> {
  const { guestUser, cartItemId, cartItemOptionId, body } = props;

  const existing =
    await MyGlobal.prisma.shopping_mall_cart_item_options.findUnique({
      where: { id: cartItemOptionId },
    });
  if (!existing) throw new Error("Cart item option not found");

  if (existing.shopping_cart_item_id !== cartItemId) {
    throw new Error("Cart item ID mismatch");
  }

  const cartItem = await MyGlobal.prisma.shopping_mall_cart_items.findUnique({
    where: { id: cartItemId },
  });
  if (!cartItem) throw new Error("Cart item not found");

  if (cartItem.shopping_cart_id) {
    const cart = await MyGlobal.prisma.shopping_mall_carts.findUnique({
      where: { id: cartItem.shopping_cart_id },
    });
    if (!cart) throw new Error("Cart not found");
    if (cart.guest_user_id !== guestUser.id) {
      throw new Error("Unauthorized: Cart does not belong to guest user");
    }
  } else {
    throw new Error("Cart item does not have associated cart");
  }

  const now = toISOStringSafe(new Date());

  const updated = await MyGlobal.prisma.shopping_mall_cart_item_options.update({
    where: { id: cartItemOptionId },
    data: {
      shopping_cart_item_id: body.shopping_cart_item_id ?? undefined,
      shopping_sale_option_group_id:
        body.shopping_sale_option_group_id ?? undefined,
      shopping_sale_option_id: body.shopping_sale_option_id ?? undefined,
      updated_at: now,
    },
  });

  return {
    id: updated.id as string & tags.Format<"uuid">,
    shopping_cart_item_id: updated.shopping_cart_item_id as string &
      tags.Format<"uuid">,
    shopping_sale_option_group_id:
      updated.shopping_sale_option_group_id as string & tags.Format<"uuid">,
    shopping_sale_option_id: updated.shopping_sale_option_id as string &
      tags.Format<"uuid">,
    created_at: toISOStringSafe(updated.created_at),
    updated_at: toISOStringSafe(updated.updated_at),
  };
}
