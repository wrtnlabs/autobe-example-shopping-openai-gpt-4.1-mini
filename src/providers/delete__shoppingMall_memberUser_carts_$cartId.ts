import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Permanently delete a shopping cart identified by 'cartId'.
 *
 * This operation performs a hard delete removing the record from the
 * 'shopping_mall_carts' table. Authorization is required to ensure the
 * authenticated member user owns the cart.
 *
 * @param props - Object containing:
 *
 *   - MemberUser: Authenticated member user's payload
 *   - CartId: UUID string of the cart to delete
 *
 * @throws {Error} When the cart does not exist or the user is unauthorized
 */
export async function delete__shoppingMall_memberUser_carts_$cartId(props: {
  memberUser: MemberuserPayload;
  cartId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { memberUser, cartId } = props;

  const cart = await MyGlobal.prisma.shopping_mall_carts.findUniqueOrThrow({
    where: { id: cartId },
    select: { id: true, member_user_id: true },
  });

  if (cart.member_user_id !== memberUser.id) {
    throw new Error(
      "Unauthorized: You can only delete your own shopping cart.",
    );
  }

  await MyGlobal.prisma.shopping_mall_carts.delete({
    where: { id: cartId },
  });
}
