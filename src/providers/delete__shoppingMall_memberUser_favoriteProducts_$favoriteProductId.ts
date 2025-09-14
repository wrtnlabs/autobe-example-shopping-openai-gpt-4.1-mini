import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Soft delete a favorite product by ID.
 *
 * This preserves the record with a deletion timestamp to maintain audit
 * integrity. Only the authenticated memberUser owning the favorite can perform
 * the deletion.
 *
 * @param props - Object containing authenticated memberUser and
 *   favoriteProductId
 * @param props.memberUser - The authenticated member user performing the
 *   deletion
 * @param props.favoriteProductId - UUID of the favorite product to delete
 * @throws {Error} When favorite product is not found or unauthorized access
 */
export async function delete__shoppingMall_memberUser_favoriteProducts_$favoriteProductId(props: {
  memberUser: MemberuserPayload;
  favoriteProductId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { memberUser, favoriteProductId } = props;

  // Verify ownership and existence of favorite product
  const favoriteProduct =
    await MyGlobal.prisma.shopping_mall_favorite_products.findFirst({
      where: {
        id: favoriteProductId,
        shopping_mall_memberuser_id: memberUser.id,
        deleted_at: null,
      },
    });

  if (!favoriteProduct) {
    throw new Error("Favorite product not found or access denied");
  }

  // Soft delete: set deleted_at and updated_at to current timestamp
  const now = toISOStringSafe(new Date());

  await MyGlobal.prisma.shopping_mall_favorite_products.update({
    where: {
      id: favoriteProductId,
    },
    data: {
      deleted_at: now,
      updated_at: now,
    },
  });
}
