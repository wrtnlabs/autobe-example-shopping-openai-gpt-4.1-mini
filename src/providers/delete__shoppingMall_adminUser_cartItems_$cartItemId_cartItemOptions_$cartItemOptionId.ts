import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

export async function delete__shoppingMall_adminUser_cartItems_$cartItemId_cartItemOptions_$cartItemOptionId(props: {
  adminUser: AdminuserPayload;
  cartItemId: string & tags.Format<"uuid">;
  cartItemOptionId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { adminUser, cartItemId, cartItemOptionId } = props;

  const found = await MyGlobal.prisma.shopping_mall_cart_item_options.findFirst(
    {
      where: {
        id: cartItemOptionId,
        shopping_cart_item_id: cartItemId,
      },
    },
  );

  if (!found) throw new Error("Cart item option not found");

  await MyGlobal.prisma.shopping_mall_cart_item_options.delete({
    where: { id: cartItemOptionId },
  });

  return;
}
