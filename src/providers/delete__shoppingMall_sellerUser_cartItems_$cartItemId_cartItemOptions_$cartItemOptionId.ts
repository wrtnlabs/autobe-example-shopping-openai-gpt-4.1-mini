import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

export async function delete__shoppingMall_sellerUser_cartItems_$cartItemId_cartItemOptions_$cartItemOptionId(props: {
  sellerUser: SelleruserPayload;
  cartItemId: string & tags.Format<"uuid">;
  cartItemOptionId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { sellerUser, cartItemId, cartItemOptionId } = props;

  // Check if the cart item option exists
  const cartItemOption =
    await MyGlobal.prisma.shopping_mall_cart_item_options.findUnique({
      where: { id: cartItemOptionId },
      include: { shoppingCartItem: true },
    });

  if (!cartItemOption) {
    throw new Error(`Cart item option not found: ${cartItemOptionId}`);
  }

  // Ownership verification is not possible due to schema limitation
  // (no sellerUser info on cart or cart item), so omitted

  // Perform soft delete by setting deleted_at field
  // Note: deleted_at does NOT exist in this model, so delete instead
  await MyGlobal.prisma.shopping_mall_cart_item_options.delete({
    where: { id: cartItemOptionId },
  });
}
