import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallCartItemOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCartItemOption";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

export async function put__shoppingMall_memberUser_cartItems_$cartItemId_cartItemOptions_$cartItemOptionId(props: {
  memberUser: MemberuserPayload;
  cartItemId: string & tags.Format<"uuid">;
  cartItemOptionId: string & tags.Format<"uuid">;
  body: IShoppingMallCartItemOption.IUpdate;
}): Promise<IShoppingMallCartItemOption> {
  const { memberUser, cartItemId, cartItemOptionId, body } = props;

  const cartItemOption =
    await MyGlobal.prisma.shopping_mall_cart_item_options.findUniqueOrThrow({
      where: { id: cartItemOptionId },
    });

  const cartItem =
    await MyGlobal.prisma.shopping_mall_cart_items.findUniqueOrThrow({
      where: { id: cartItemOption.shopping_cart_item_id },
    });

  if (cartItem.member_user_id !== memberUser.id) {
    throw new Error(
      "Unauthorized: You can only update your own cart item options.",
    );
  }

  const updated = await MyGlobal.prisma.shopping_mall_cart_item_options.update({
    where: { id: cartItemOptionId },
    data: {
      ...(body.shopping_cart_item_id !== undefined && {
        shopping_cart_item_id: body.shopping_cart_item_id,
      }),
      ...(body.shopping_sale_option_group_id !== undefined && {
        shopping_sale_option_group_id: body.shopping_sale_option_group_id,
      }),
      ...(body.shopping_sale_option_id !== undefined && {
        shopping_sale_option_id: body.shopping_sale_option_id,
      }),
      updated_at: toISOStringSafe(new Date()),
    },
  });

  return {
    id: updated.id,
    shopping_cart_item_id: updated.shopping_cart_item_id,
    shopping_sale_option_group_id: updated.shopping_sale_option_group_id,
    shopping_sale_option_id: updated.shopping_sale_option_id,
    created_at: toISOStringSafe(updated.created_at),
    updated_at: toISOStringSafe(updated.updated_at),
  };
}
