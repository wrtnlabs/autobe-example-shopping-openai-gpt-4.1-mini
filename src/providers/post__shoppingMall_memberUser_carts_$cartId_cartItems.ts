import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallCartItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCartItem";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Add a new item to the specified shopping cart.
 *
 * Creates a shopping_mall_cart_items record linked to the cart identified by
 * cartId. Validates the cart's existence and ensures the request body
 * references the correct cart. Sets creation and update timestamps, generates a
 * new UUID for the cart item.
 *
 * @param props - Object containing authenticated memberUser, cartId, and cart
 *   item creation body.
 * @param props.memberUser - Authenticated member user payload.
 * @param props.cartId - UUID of the target shopping cart to add item to.
 * @param props.body - Request body containing cart item creation details.
 * @returns The newly created cart item matching IShoppingMallCartItem
 *   structure.
 * @throws {Error} When the cart does not exist.
 * @throws {Error} When the body.shopping_cart_id does not match cartId.
 */
export async function post__shoppingMall_memberUser_carts_$cartId_cartItems(props: {
  memberUser: MemberuserPayload;
  cartId: string & tags.Format<"uuid">;
  body: IShoppingMallCartItem.ICreate;
}): Promise<IShoppingMallCartItem> {
  const { memberUser, cartId, body } = props;

  // Verify cart existence
  const cart = await MyGlobal.prisma.shopping_mall_carts.findFirst({
    where: { id: cartId },
  });

  if (!cart) {
    throw new Error(`Cart not found: ${cartId}`);
  }

  // Validate body cart id matches path param
  if (body.shopping_cart_id !== cartId) {
    throw new Error("Body shopping_cart_id must match cartId parameter");
  }

  // Generate UUID and current timestamp
  const now = toISOStringSafe(new Date());
  const id = v4() as string & tags.Format<"uuid">;

  // Create cart item record
  const created = await MyGlobal.prisma.shopping_mall_cart_items.create({
    data: {
      id,
      shopping_cart_id: cartId,
      shopping_sale_snapshot_id: body.shopping_sale_snapshot_id,
      quantity: body.quantity,
      unit_price: body.unit_price,
      status: body.status,
      deleted_at: body.deleted_at ?? null,
      created_at: now,
      updated_at: now,
    },
  });

  // Return properly converted cart item
  return {
    id: created.id,
    shopping_cart_id: created.shopping_cart_id,
    shopping_sale_snapshot_id: created.shopping_sale_snapshot_id,
    quantity: created.quantity,
    unit_price: created.unit_price,
    status: created.status,
    deleted_at: created.deleted_at ? toISOStringSafe(created.deleted_at) : null,
    created_at: toISOStringSafe(created.created_at),
    updated_at: toISOStringSafe(created.updated_at),
  };
}
