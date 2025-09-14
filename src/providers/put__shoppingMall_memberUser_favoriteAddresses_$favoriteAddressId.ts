import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallFavoriteAddress } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallFavoriteAddress";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Update favorite address by ID.
 *
 * This operation updates an existing favorite address record identified by its
 * unique ID. It allows changes to the address snapshot references and other
 * editable properties while ensuring referential integrity.
 *
 * Authorization restricts this update to the owning authenticated member user.
 *
 * The updated record’s timestamps will also refresh.
 *
 * @param props - Object containing memberUser payload, the favorite address ID,
 *   and the body of updates to apply.
 * @param props.memberUser - Authenticated member user executing the update.
 * @param props.favoriteAddressId - Unique identifier of the favorite address.
 * @param props.body - Partial update data for the favorite address.
 * @returns The updated favorite address record.
 * @throws {Error} When the favorite address does not belong to the
 *   authenticated user or record does not exist.
 */
export async function put__shoppingMall_memberUser_favoriteAddresses_$favoriteAddressId(props: {
  memberUser: MemberuserPayload;
  favoriteAddressId: string & tags.Format<"uuid">;
  body: IShoppingMallFavoriteAddress.IUpdate;
}): Promise<IShoppingMallFavoriteAddress> {
  const { memberUser, favoriteAddressId, body } = props;

  const favoriteAddress =
    await MyGlobal.prisma.shopping_mall_favorite_addresses.findUniqueOrThrow({
      where: { id: favoriteAddressId },
    });

  if (favoriteAddress.shopping_mall_memberuser_id !== memberUser.id) {
    throw new Error("Unauthorized operation");
  }

  const updated = await MyGlobal.prisma.shopping_mall_favorite_addresses.update(
    {
      where: { id: favoriteAddressId },
      data: {
        shopping_mall_memberuser_id:
          body.shopping_mall_memberuser_id ?? undefined,
        shopping_mall_snapshot_id: body.shopping_mall_snapshot_id ?? undefined,
        deleted_at: body.deleted_at ?? undefined,
        updated_at: toISOStringSafe(new Date()),
      },
    },
  );

  return {
    id: updated.id,
    shopping_mall_memberuser_id: updated.shopping_mall_memberuser_id,
    shopping_mall_snapshot_id: updated.shopping_mall_snapshot_id,
    created_at: toISOStringSafe(updated.created_at),
    updated_at: toISOStringSafe(updated.updated_at),
    deleted_at: updated.deleted_at ? toISOStringSafe(updated.deleted_at) : null,
  };
}
