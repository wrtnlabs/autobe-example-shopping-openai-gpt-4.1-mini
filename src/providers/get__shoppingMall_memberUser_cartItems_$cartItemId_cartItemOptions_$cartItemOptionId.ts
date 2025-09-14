import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallCartItemOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCartItemOption";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Get detailed information for a specific cart item option by ID under the cart
 * item identified by cartItemId.
 *
 * Accessible to authenticated member users managing their carts.
 *
 * @param props - Object containing memberUser payload, cartItemId and
 *   cartItemOptionId
 * @param props.memberUser - Authenticated member user making the request
 * @param props.cartItemId - UUID of the target cart item
 * @param props.cartItemOptionId - UUID of the cart item option to retrieve
 * @returns Detailed cart item option information
 * @throws {Error} Throws if the cart item option does not exist or does not
 *   belong to the specified cart item
 */
export async function get__shoppingMall_memberUser_cartItems_$cartItemId_cartItemOptions_$cartItemOptionId(props: {
  memberUser: MemberuserPayload;
  cartItemId: string & tags.Format<"uuid">;
  cartItemOptionId: string & tags.Format<"uuid">;
}): Promise<IShoppingMallCartItemOption> {
  const { memberUser, cartItemId, cartItemOptionId } = props;

  const cartItemOption =
    await MyGlobal.prisma.shopping_mall_cart_item_options.findFirstOrThrow({
      where: {
        id: cartItemOptionId,
        shopping_cart_item_id: cartItemId,
      },
    });

  return {
    id: cartItemOption.id,
    shopping_cart_item_id: cartItemOption.shopping_cart_item_id,
    shopping_sale_option_group_id: cartItemOption.shopping_sale_option_group_id,
    shopping_sale_option_id: cartItemOption.shopping_sale_option_id,
    created_at: toISOStringSafe(cartItemOption.created_at),
    updated_at: toISOStringSafe(cartItemOption.updated_at),
  };
}
