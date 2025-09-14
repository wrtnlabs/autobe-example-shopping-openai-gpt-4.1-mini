import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallFavoriteProduct } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallFavoriteProduct";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Retrieve detailed favorite product information by favoriteProductId for
 * authenticated member users.
 *
 * This operation ensures that only the owning member user can access the
 * favorite product details. Returns the full favorite product entity including
 * timestamps and soft delete status.
 *
 * @param props - Object containing authenticated memberUser and
 *   favoriteProductId.
 * @param props.memberUser - Authenticated member user payload.
 * @param props.favoriteProductId - UUID identifying the favorite product
 *   record.
 * @returns The detailed favorite product entity.
 * @throws {Error} When the favorite product is not found or the member user is
 *   unauthorized.
 */
export async function get__shoppingMall_memberUser_favoriteProducts_$favoriteProductId(props: {
  memberUser: MemberuserPayload;
  favoriteProductId: string & tags.Format<"uuid">;
}): Promise<IShoppingMallFavoriteProduct> {
  const { memberUser, favoriteProductId } = props;

  // Find favorite product by ID
  const favoriteProduct =
    await MyGlobal.prisma.shopping_mall_favorite_products.findUniqueOrThrow({
      where: { id: favoriteProductId },
    });

  // Authorization check: ensure favorite product belongs to the authenticated user
  if (favoriteProduct.shopping_mall_memberuser_id !== memberUser.id) {
    throw new Error(
      "Unauthorized: You can only access your own favorite products.",
    );
  }

  // Map Date to ISO string format with branding
  return {
    id: favoriteProduct.id,
    shopping_mall_memberuser_id: favoriteProduct.shopping_mall_memberuser_id,
    shopping_mall_sale_snapshot_id:
      favoriteProduct.shopping_mall_sale_snapshot_id,
    created_at: toISOStringSafe(favoriteProduct.created_at),
    updated_at: toISOStringSafe(favoriteProduct.updated_at),
    deleted_at: favoriteProduct.deleted_at
      ? toISOStringSafe(favoriteProduct.deleted_at)
      : null,
  };
}
