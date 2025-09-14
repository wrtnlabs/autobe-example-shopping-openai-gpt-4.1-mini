import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallCarts } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCarts";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Updates an existing shopping cart identified by 'cartId'.
 *
 * This operation allows an authenticated member user to modify fields such as
 * status, associated user ids, and soft deletion timestamp. Ownership
 * verification ensures that only the cart owner can perform updates.
 *
 * @param props - Object containing memberUser payload, cart identifier, and
 *   partial update fields conforming to IShoppingMallCarts.IUpdate
 * @returns The updated shopping cart with all properties and ISO 8601 formatted
 *   date strings.
 * @throws {Error} When the shopping cart is not found or unauthorized access is
 *   attempted.
 */
export async function put__shoppingMall_memberUser_carts_$cartId(props: {
  memberUser: MemberuserPayload;
  cartId: string & tags.Format<"uuid">;
  body: IShoppingMallCarts.IUpdate;
}): Promise<IShoppingMallCarts> {
  const { memberUser, cartId, body } = props;

  const cart = await MyGlobal.prisma.shopping_mall_carts.findUnique({
    where: { id: cartId },
  });
  if (!cart) throw new Error("Shopping cart not found");

  if (cart.member_user_id !== memberUser.id) {
    throw new Error("Unauthorized: You can only update your own cart");
  }

  const now = toISOStringSafe(new Date());

  await MyGlobal.prisma.shopping_mall_carts.update({
    where: { id: cartId },
    data: {
      guest_user_id: body.guest_user_id ?? undefined,
      member_user_id: body.member_user_id ?? undefined,
      status: body.status ?? undefined,
      deleted_at:
        body.deleted_at === null ? null : (body.deleted_at ?? undefined),
      updated_at: now,
    },
  });

  const updated = await MyGlobal.prisma.shopping_mall_carts.findUniqueOrThrow({
    where: { id: cartId },
  });

  return {
    id: updated.id,
    guest_user_id: updated.guest_user_id ?? null,
    member_user_id: updated.member_user_id ?? null,
    status: updated.status,
    created_at: toISOStringSafe(updated.created_at),
    updated_at: toISOStringSafe(updated.updated_at),
    deleted_at: updated.deleted_at ? toISOStringSafe(updated.deleted_at) : null,
  };
}
