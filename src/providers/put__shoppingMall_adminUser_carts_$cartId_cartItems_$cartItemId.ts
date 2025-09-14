import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallCartItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCartItem";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Updates an existing cart item identified by cartItemId within the specified
 * cart.
 *
 * This operation updates quantity, unit price, status, and optionally the
 * deletion timestamp. It verifies the existence of the cart item and that it
 * belongs to the specified cart.
 *
 * @param props - Object containing adminUser authentication, cartId,
 *   cartItemId, and update body
 * @param props.adminUser - Authenticated admin user making the request
 * @param props.cartId - UUID of the shopping cart containing the cart item
 * @param props.cartItemId - UUID of the cart item to update
 * @param props.body - Update data for the cart item
 * @returns The updated shopping mall cart item with all relevant fields
 * @throws {Error} If the cart item is not found or does not belong to the given
 *   cart
 */
export async function put__shoppingMall_adminUser_carts_$cartId_cartItems_$cartItemId(props: {
  adminUser: AdminuserPayload;
  cartId: string & tags.Format<"uuid">;
  cartItemId: string & tags.Format<"uuid">;
  body: IShoppingMallCartItem.IUpdate;
}): Promise<IShoppingMallCartItem> {
  const { adminUser, cartId, cartItemId, body } = props;

  const existingCartItem =
    await MyGlobal.prisma.shopping_mall_cart_items.findFirst({
      where: {
        id: cartItemId,
        shopping_cart_id: cartId,
        deleted_at: null,
      },
    });

  if (!existingCartItem) {
    throw new Error(
      "Cart item not found or does not belong to the specified cart",
    );
  }

  const updated = await MyGlobal.prisma.shopping_mall_cart_items.update({
    where: { id: cartItemId },
    data: {
      quantity: body.quantity ?? undefined,
      unit_price: body.unit_price ?? undefined,
      status: body.status ?? undefined,
      deleted_at:
        body.deleted_at === null ? null : (body.deleted_at ?? undefined),
      updated_at: toISOStringSafe(new Date()),
    },
  });

  return {
    id: updated.id as string & tags.Format<"uuid">,
    shopping_cart_id: updated.shopping_cart_id as string & tags.Format<"uuid">,
    shopping_sale_snapshot_id: updated.shopping_sale_snapshot_id as string &
      tags.Format<"uuid">,
    quantity: updated.quantity as number & tags.Type<"int32">,
    unit_price: updated.unit_price,
    created_at: toISOStringSafe(updated.created_at),
    updated_at: toISOStringSafe(updated.updated_at),
    deleted_at: updated.deleted_at ? toISOStringSafe(updated.deleted_at) : null,
    status: updated.status,
  };
}
