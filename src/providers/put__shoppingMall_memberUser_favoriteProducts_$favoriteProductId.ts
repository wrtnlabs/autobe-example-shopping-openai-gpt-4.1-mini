import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallFavoriteProduct } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallFavoriteProduct";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Update an existing favorite product by ID.
 *
 * This operation updates the favorite product information identified by the
 * favoriteProductId for the authenticated member user. It ensures that only the
 * owner member user can update their favorite product entry.
 *
 * @param props - Object containing the authenticated memberUser, the
 *   favoriteProductId to update, and the update body with favorite product
 *   field modifications.
 * @param props.memberUser - Authenticated member user performing the update.
 * @param props.favoriteProductId - The UUID of the favorite product to update.
 * @param props.body - Data object containing fields to update on the favorite
 *   product.
 * @returns The updated favorite product entity reflecting the latest persisted
 *   data.
 * @throws {Error} When the favorite product is not found or the memberUser is
 *   unauthorized.
 */
export async function put__shoppingMall_memberUser_favoriteProducts_$favoriteProductId(props: {
  memberUser: MemberuserPayload;
  favoriteProductId: string & tags.Format<"uuid">;
  body: IShoppingMallFavoriteProduct.IUpdate;
}): Promise<IShoppingMallFavoriteProduct> {
  const { memberUser, favoriteProductId, body } = props;

  // Authorization check: verify ownership and existence
  const existing =
    await MyGlobal.prisma.shopping_mall_favorite_products.findFirst({
      where: {
        id: favoriteProductId,
        shopping_mall_memberuser_id: memberUser.id,
        deleted_at: null,
      },
    });

  if (!existing) throw new Error("Favorite product not found or unauthorized");

  const updated = await MyGlobal.prisma.shopping_mall_favorite_products.update({
    where: { id: favoriteProductId },
    data: {
      shopping_mall_memberuser_id:
        body.shopping_mall_memberuser_id ?? undefined,
      shopping_mall_sale_snapshot_id:
        body.shopping_mall_sale_snapshot_id ?? undefined,
      deleted_at:
        body.deleted_at === null ? null : (body.deleted_at ?? undefined),
      updated_at: toISOStringSafe(new Date()),
    },
  });

  return {
    id: updated.id,
    shopping_mall_memberuser_id: updated.shopping_mall_memberuser_id,
    shopping_mall_sale_snapshot_id: updated.shopping_mall_sale_snapshot_id,
    created_at: toISOStringSafe(updated.created_at),
    updated_at: toISOStringSafe(updated.updated_at),
    deleted_at: updated.deleted_at ? toISOStringSafe(updated.deleted_at) : null,
  };
}
