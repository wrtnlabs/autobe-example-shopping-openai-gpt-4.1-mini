import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallCarts } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCarts";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Get detailed information about a specific shopping cart belonging to the
 * authenticated member user.
 *
 * This function retrieves the shopping cart identified by 'cartId' and ensures
 * the requesting user owns the cart. It returns all relevant cart fields,
 * including ownership information, status, and timestamps.
 *
 * @param props - Object containing the authenticated member user and the cart
 *   identifier.
 * @param props.memberUser - The authenticated member user making the request.
 * @param props.cartId - The UUID of the shopping cart to retrieve.
 * @returns A promise that resolves to detailed shopping cart information
 *   matching IShoppingMallCarts.
 * @throws {Error} Throws if the cart is not found or the user is unauthorized
 *   to access the cart.
 */
export async function get__shoppingMall_memberUser_carts_$cartId(props: {
  memberUser: MemberuserPayload;
  cartId: string & tags.Format<"uuid">;
}): Promise<IShoppingMallCarts> {
  const { memberUser, cartId } = props;

  const cart = await MyGlobal.prisma.shopping_mall_carts.findFirstOrThrow({
    where: {
      id: cartId,
      member_user_id: memberUser.id,
    },
  });

  return {
    id: cart.id,
    guest_user_id: cart.guest_user_id ?? null,
    member_user_id: cart.member_user_id ?? null,
    status: cart.status,
    created_at: toISOStringSafe(cart.created_at),
    updated_at: toISOStringSafe(cart.updated_at),
    deleted_at: cart.deleted_at ? toISOStringSafe(cart.deleted_at) : null,
  };
}
