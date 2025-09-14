import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Deletes a specific favorite address by its ID.
 *
 * This operation permanently removes the favorite address record from the
 * shopping mall database. It ensures that the favorite address exists and
 * belongs to the authenticated member user identified in the token.
 *
 * @param props - Object containing the authenticated member user and the
 *   favorite address ID to be deleted.
 * @param props.memberUser - The authenticated member user payload.
 * @param props.favoriteAddressId - UUID of the favorite address to delete.
 * @throws {Error} When the favorite address does not exist.
 * @throws {Error} When the favorite address does not belong to the
 *   authenticated member user.
 */
export async function delete__shoppingMall_memberUser_favoriteAddresses_$favoriteAddressId(props: {
  memberUser: MemberuserPayload;
  favoriteAddressId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { memberUser, favoriteAddressId } = props;

  // Find the favorite address by id
  const favoriteAddress =
    await MyGlobal.prisma.shopping_mall_favorite_addresses.findUnique({
      where: { id: favoriteAddressId },
    });

  if (!favoriteAddress) throw new Error("Favorite address not found");

  // Authorization check: ensure it belongs to the member user
  if (favoriteAddress.shopping_mall_memberuser_id !== memberUser.id) {
    throw new Error("Unauthorized: favorite address does not belong to user");
  }

  // Perform hard delete
  await MyGlobal.prisma.shopping_mall_favorite_addresses.delete({
    where: { id: favoriteAddressId },
  });
}
