import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallFavoriteAddress } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallFavoriteAddress";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Retrieve a specific favorite address by ID (member user only).
 *
 * This function fetches a single favorite address record from the
 * shopping_mall_favorite_addresses table. It includes all relevant audit
 * timestamps and ensures the authenticated member user only accesses their own
 * records.
 *
 * @param props - The function parameters.
 * @param props.memberUser - The authenticated member user making the request.
 * @param props.favoriteAddressId - The UUID of the favorite address to
 *   retrieve.
 * @returns The detailed favorite address record.
 * @throws {Error} Throws if the favorite address does not exist or if the user
 *   is unauthorized to access it.
 */
export async function get__shoppingMall_memberUser_favoriteAddresses_$favoriteAddressId(props: {
  memberUser: MemberuserPayload;
  favoriteAddressId: string & tags.Format<"uuid">;
}): Promise<IShoppingMallFavoriteAddress> {
  const { memberUser, favoriteAddressId } = props;

  const favoriteAddress =
    await MyGlobal.prisma.shopping_mall_favorite_addresses.findUniqueOrThrow({
      where: { id: favoriteAddressId },
    });

  if (favoriteAddress.shopping_mall_memberuser_id !== memberUser.id) {
    throw new Error(
      "Unauthorized: You can only access your own favorite addresses",
    );
  }

  return {
    id: favoriteAddress.id,
    shopping_mall_memberuser_id: favoriteAddress.shopping_mall_memberuser_id,
    shopping_mall_snapshot_id: favoriteAddress.shopping_mall_snapshot_id,
    created_at: toISOStringSafe(favoriteAddress.created_at),
    updated_at: toISOStringSafe(favoriteAddress.updated_at),
    deleted_at: favoriteAddress.deleted_at
      ? toISOStringSafe(favoriteAddress.deleted_at)
      : null,
  };
}
