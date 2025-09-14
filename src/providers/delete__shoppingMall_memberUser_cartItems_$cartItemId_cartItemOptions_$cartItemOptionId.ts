import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

export async function delete__shoppingMall_memberUser_cartItems_$cartItemId_cartItemOptions_$cartItemOptionId(props: {
  memberUser: MemberuserPayload;
  cartItemId: string & tags.Format<"uuid">;
  cartItemOptionId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { memberUser, cartItemId, cartItemOptionId } = props;

  const cartItemOption =
    await MyGlobal.prisma.shopping_mall_cart_item_options.findUnique({
      where: { id: cartItemOptionId },
      select: {
        id: true,
        shopping_cart_item_id: true,
      },
    });
  if (!cartItemOption) throw new Error("Cart item option not found");

  if (cartItemOption.shopping_cart_item_id !== cartItemId) {
    throw new Error(
      "Cart item option does not belong to the specified cart item",
    );
  }

  const cartItem = await MyGlobal.prisma.shopping_mall_cart_items.findUnique({
    where: { id: cartItemId },
    select: {
      id: true,
      shopping_cart_id: true,
    },
  });
  if (!cartItem) throw new Error("Cart item not found");

  const cart = await MyGlobal.prisma.shopping_mall_carts.findUnique({
    where: { id: cartItem.shopping_cart_id },
    select: {
      member_user_id: true,
    },
  });
  if (!cart) throw new Error("Cart not found");

  if (cart.member_user_id !== memberUser.id) {
    throw new Error(
      "Unauthorized: Cart item does not belong to the member user",
    );
  }

  await MyGlobal.prisma.shopping_mall_cart_item_options.update({
    where: { id: cartItemOptionId },
    data: {
      deleted_at: toISOStringSafe(new Date()),
    },
  });
}
