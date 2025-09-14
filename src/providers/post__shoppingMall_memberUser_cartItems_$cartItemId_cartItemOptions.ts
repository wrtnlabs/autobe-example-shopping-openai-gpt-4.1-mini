import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallCartItemOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCartItemOption";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

export async function post__shoppingMall_memberUser_cartItems_$cartItemId_cartItemOptions(props: {
  memberUser: MemberuserPayload;
  cartItemId: string & tags.Format<"uuid">;
  body: IShoppingMallCartItemOption.ICreate;
}): Promise<IShoppingMallCartItemOption> {
  const { memberUser, cartItemId, body } = props;

  // Verify the cart item exists and belongs to the authenticated member user
  const cartItem = await MyGlobal.prisma.shopping_mall_cart_items.findUnique({
    where: { id: cartItemId },
  });
  if (!cartItem) throw new Error("Cart item not found");

  // Authorization: shopping_mall_cart_items model has guest_user_id and member_user_id?
  // The schema snippet showed guest_user_id and member_user_id fields on shopping_mall_carts, but cart_items model snippet does not show member_user_id
  // Therefore, need to verify via shopping_cart_id and its member user association

  // Fetch the shopping cart to verify ownership
  const shoppingCart = await MyGlobal.prisma.shopping_mall_carts.findUnique({
    where: { id: cartItem.shopping_cart_id },
    select: { member_user_id: true },
  });
  if (!shoppingCart) throw new Error("Shopping cart not found");
  if (shoppingCart.member_user_id !== memberUser.id)
    throw new Error("Unauthorized access to cart item");

  // Validate that the option group exists
  const optionGroup =
    await MyGlobal.prisma.shopping_mall_sale_option_groups.findUnique({
      where: { id: body.shopping_sale_option_group_id },
    });
  if (!optionGroup) throw new Error("Option group not found");

  // Validate that the sale option exists
  const saleOption =
    await MyGlobal.prisma.shopping_mall_sale_options.findUnique({
      where: { id: body.shopping_sale_option_id },
    });
  if (!saleOption) throw new Error("Sale option not found");

  // Generate new UUID for the cart item option
  const newId = v4() as string & tags.Format<"uuid">;

  // Create timestamps in ISO string format
  const now = toISOStringSafe(new Date());

  // Create the new cart item option
  const created = await MyGlobal.prisma.shopping_mall_cart_item_options.create({
    data: {
      id: newId,
      shopping_cart_item_id: cartItemId,
      shopping_sale_option_group_id: body.shopping_sale_option_group_id,
      shopping_sale_option_id: body.shopping_sale_option_id,
      created_at: now,
      updated_at: now,
    },
  });

  // Return created record with date-time values converted
  return {
    id: created.id,
    shopping_cart_item_id: created.shopping_cart_item_id,
    shopping_sale_option_group_id: created.shopping_sale_option_group_id,
    shopping_sale_option_id: created.shopping_sale_option_id,
    created_at: toISOStringSafe(created.created_at),
    updated_at: toISOStringSafe(created.updated_at),
  };
}
