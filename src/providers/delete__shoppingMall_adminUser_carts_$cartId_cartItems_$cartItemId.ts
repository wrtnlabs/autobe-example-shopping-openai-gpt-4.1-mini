import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Deletes a cart item by its ID within a specified cart.
 *
 * This operation performs a soft delete by setting the 'deleted_at' timestamp.
 * It verifies the existence of both the cart and the cart item before deletion.
 * Only accessible by authenticated admin users.
 *
 * @param props - Object containing adminUser authentication and identifiers
 * @param props.adminUser - The authenticated admin user payload
 * @param props.cartId - UUID of the cart containing the cart item
 * @param props.cartItemId - UUID of the cart item to delete
 * @throws {Error} When the cart or cart item does not exist or is already
 *   deleted
 */
export async function delete__shoppingMall_adminUser_carts_$cartId_cartItems_$cartItemId(props: {
  adminUser: AdminuserPayload;
  cartId: string & tags.Format<"uuid">;
  cartItemId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { adminUser, cartId, cartItemId } = props;

  // Verify existence of the cart (not deleted)
  const cart = await MyGlobal.prisma.shopping_mall_carts.findFirst({
    where: { id: cartId, deleted_at: null },
  });

  if (!cart) throw new Error(`Cart not found with id: ${cartId}`);

  // Verify existence of the cart item (not deleted and belongs to the cart)
  const cartItem = await MyGlobal.prisma.shopping_mall_cart_items.findFirst({
    where: { id: cartItemId, shopping_cart_id: cartId, deleted_at: null },
  });

  if (!cartItem)
    throw new Error(
      `Cart item not found with id: ${cartItemId} for cart: ${cartId}`,
    );

  // Perform soft delete by setting deleted_at timestamp
  const now: string & tags.Format<"date-time"> = toISOStringSafe(new Date());

  await MyGlobal.prisma.shopping_mall_cart_items.update({
    where: { id: cartItemId },
    data: { deleted_at: now },
  });
}
