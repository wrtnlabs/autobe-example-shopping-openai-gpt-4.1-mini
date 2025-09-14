import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { GuestuserPayload } from "../decorators/payload/GuestuserPayload";

export async function delete__shoppingMall_guestUser_cartItems_$cartItemId_cartItemOptions_$cartItemOptionId(props: {
  guestUser: GuestuserPayload;
  cartItemId: string & tags.Format<"uuid">;
  cartItemOptionId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { guestUser, cartItemId, cartItemOptionId } = props;

  // Find cart item option and verify it belongs to the given cart item
  const cartItemOption =
    await MyGlobal.prisma.shopping_mall_cart_item_options.findUnique({
      where: { id: cartItemOptionId },
      select: {
        id: true,
        shopping_cart_id: true, // Correct field name from schema
      },
    });
  if (!cartItemOption) throw new Error("Cart item option not found");

  if (cartItemOption.shopping_cart_id !== cartItemId) {
    throw new Error(
      "Cart item option does not belong to the specified cart item",
    );
  }

  // Find cart item and verify ownership by the guest user
  const cartItem = await MyGlobal.prisma.shopping_mall_carts.findUnique({
    where: { id: cartItemId },
    select: {
      guest_user_id: true,
    },
  });
  if (!cartItem) throw new Error("Cart item not found");

  if (cartItem.guest_user_id !== guestUser.id) {
    throw new Error(
      "Unauthorized: You can only delete your own cart item options",
    );
  }

  // Perform hard delete since deleted_at does not exist in shopping_mall_cart_item_options model
  await MyGlobal.prisma.shopping_mall_cart_item_options.delete({
    where: { id: cartItemOptionId },
  });
}
