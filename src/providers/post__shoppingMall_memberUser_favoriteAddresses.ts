import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallFavoriteAddress } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallFavoriteAddress";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Create a new favorite address record for a member user referencing an address
 * snapshot.
 *
 * This function validates authorized member user access, generates a unique
 * identifier, records timestamps for creation and update, and persists the
 * favorite address to the database.
 *
 * @param props - Object containing authenticated member user payload and body
 *   for creating the favorite address
 * @param props.memberUser - Authenticated member user payload containing user
 *   ID
 * @param props.body - Favorite address creation data containing snapshot ID
 * @returns The newly created favorite address record with all fields including
 *   timestamps
 * @throws {Error} Throws if database operation fails or constraints are
 *   violated
 */
export async function post__shoppingMall_memberUser_favoriteAddresses(props: {
  memberUser: MemberuserPayload;
  body: IShoppingMallFavoriteAddress.ICreate;
}): Promise<IShoppingMallFavoriteAddress> {
  const id = v4();
  const now = toISOStringSafe(new Date());

  const created = await MyGlobal.prisma.shopping_mall_favorite_addresses.create(
    {
      data: {
        id,
        shopping_mall_memberuser_id: props.memberUser.id,
        shopping_mall_snapshot_id: props.body.shopping_mall_snapshot_id,
        created_at: now,
        updated_at: now,
      },
    },
  );

  return {
    id: created.id,
    shopping_mall_memberuser_id: created.shopping_mall_memberuser_id,
    shopping_mall_snapshot_id: created.shopping_mall_snapshot_id,
    created_at: toISOStringSafe(created.created_at),
    updated_at: toISOStringSafe(created.updated_at),
    deleted_at:
      created.deleted_at === null ? null : toISOStringSafe(created.deleted_at),
  };
}
