import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallCartItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCartItem";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Update cart item by ID within a cart.
 *
 * Updates an existing cart item identified by cartItemId within the specified
 * cart cartId. Allows modifying quantity, unit price, status, and deleted_at
 * flag.
 *
 * Authorization: Only the memberUser owning the cart can perform this
 * operation.
 *
 * @param props - Object containing memberUser, cartId, cartItemId, and update
 *   body
 * @param props.memberUser - Authenticated member user performing the update
 * @param props.cartId - UUID of the shopping cart
 * @param props.cartItemId - UUID of the cart item to update
 * @param props.body - Partial update data for the cart item
 * @returns The fully updated cart item with all standard fields
 * @throws {Error} When the cart or cart item does not exist or not authorized
 */
export async function put__shoppingMall_memberUser_carts_$cartId_cartItems_$cartItemId(props: {
  memberUser: MemberuserPayload;
  cartId: string & tags.Format<"uuid">;
  cartItemId: string & tags.Format<"uuid">;
  body: IShoppingMallCartItem.IUpdate;
}): Promise<IShoppingMallCartItem> {
  const { memberUser, cartId, cartItemId, body } = props;

  // Verify the cart exists and belongs to the user
  const cart = await MyGlobal.prisma.shopping_mall_carts.findFirst({
    where: {
      id: cartId,
      member_user_id: memberUser.id,
    },
  });

  if (!cart) throw new Error("Cart not found or unauthorized");

  // Verify the cart item belongs to the cart
  const cartItem = await MyGlobal.prisma.shopping_mall_cart_items.findFirst({
    where: {
      id: cartItemId,
      shopping_cart_id: cartId,
    },
  });

  if (!cartItem) throw new Error("Cart item not found or unauthorized");

  // Prepare update data with proper handling of nullable and optional fields
  const updated = await MyGlobal.prisma.shopping_mall_cart_items.update({
    where: {
      id: cartItemId,
    },
    data: {
      quantity: body.quantity ?? undefined,
      unit_price: body.unit_price ?? undefined,
      status: body.status ?? undefined,
      deleted_at:
        body.deleted_at === null ? null : (body.deleted_at ?? undefined),
      updated_at: toISOStringSafe(new Date()),
    },
  });

  // Convert and return updated cart item with all date fields as ISO strings
  return {
    id: updated.id,
    shopping_cart_id: updated.shopping_cart_id,
    shopping_sale_snapshot_id: updated.shopping_sale_snapshot_id,
    quantity: updated.quantity,
    unit_price: updated.unit_price,
    status: updated.status,
    deleted_at: updated.deleted_at ? toISOStringSafe(updated.deleted_at) : null,
    created_at: toISOStringSafe(updated.created_at),
    updated_at: toISOStringSafe(updated.updated_at),
  };
}
