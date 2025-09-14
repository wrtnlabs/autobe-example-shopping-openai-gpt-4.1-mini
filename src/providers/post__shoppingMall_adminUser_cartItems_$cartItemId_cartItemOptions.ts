import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallCartItemOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCartItemOption";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Add a new option selection to a cart item.
 *
 * This function creates a new shopping_mall_cart_item_option record linking the
 * specified cart item, option group, and sale option. It validates that the
 * cart item exists and sets timestamps appropriately.
 *
 * @param props - Object containing adminUser, cartItemId, and request body with
 *   option group and sale option IDs.
 * @returns The created cart item option data with all fields including
 *   timestamps.
 * @throws {Error} When the cart item specified by cartItemId does not exist.
 */
export async function post__shoppingMall_adminUser_cartItems_$cartItemId_cartItemOptions(props: {
  adminUser: AdminuserPayload;
  cartItemId: string & tags.Format<"uuid">;
  body: IShoppingMallCartItemOption.ICreate;
}): Promise<IShoppingMallCartItemOption> {
  const { adminUser, cartItemId, body } = props;

  // Validate cart item existence
  const cartItem = await MyGlobal.prisma.shopping_mall_cart_items.findUnique({
    where: { id: cartItemId },
  });
  if (!cartItem) {
    throw new Error(`Cart item not found: ${cartItemId}`);
  }

  // Prepare timestamps
  const now = toISOStringSafe(new Date());

  // Create new cart item option
  const created = await MyGlobal.prisma.shopping_mall_cart_item_options.create({
    data: {
      id: v4() as string & tags.Format<"uuid">,
      shopping_cart_item_id: body.shopping_cart_item_id,
      shopping_sale_option_group_id: body.shopping_sale_option_group_id,
      shopping_sale_option_id: body.shopping_sale_option_id,
      created_at: now,
      updated_at: now,
    },
  });

  // Return with date fields converted
  return {
    id: created.id,
    shopping_cart_item_id: created.shopping_cart_item_id,
    shopping_sale_option_group_id: created.shopping_sale_option_group_id,
    shopping_sale_option_id: created.shopping_sale_option_id,
    created_at: toISOStringSafe(created.created_at),
    updated_at: toISOStringSafe(created.updated_at),
  };
}
