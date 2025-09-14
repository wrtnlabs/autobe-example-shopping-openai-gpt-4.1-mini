import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallCartItemOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCartItemOption";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Get detailed information for a specific cart item option by ID under the cart
 * item identified by cartItemId.
 *
 * Accessible to authenticated admin users with full rights.
 *
 * @param props - Object containing authentication and identifiers
 * @param props.adminUser - Authenticated admin user payload
 * @param props.cartItemId - UUID of the cart item
 * @param props.cartItemOptionId - UUID of the cart item option
 * @returns Promise resolving to the detailed cart item option information
 * @throws {Error} Throws if the cart item option does not exist
 */
export async function get__shoppingMall_adminUser_cartItems_$cartItemId_cartItemOptions_$cartItemOptionId(props: {
  adminUser: AdminuserPayload;
  cartItemId: string & tags.Format<"uuid">;
  cartItemOptionId: string & tags.Format<"uuid">;
}): Promise<IShoppingMallCartItemOption> {
  const { cartItemId, cartItemOptionId } = props;

  const found =
    await MyGlobal.prisma.shopping_mall_cart_item_options.findFirstOrThrow({
      where: {
        id: cartItemOptionId,
        shopping_cart_item_id: cartItemId,
      },
    });

  return {
    id: found.id,
    shopping_cart_item_id: found.shopping_cart_item_id,
    shopping_sale_option_group_id: found.shopping_sale_option_group_id,
    shopping_sale_option_id: found.shopping_sale_option_id,
    created_at: toISOStringSafe(found.created_at),
    updated_at: toISOStringSafe(found.updated_at),
  };
}
