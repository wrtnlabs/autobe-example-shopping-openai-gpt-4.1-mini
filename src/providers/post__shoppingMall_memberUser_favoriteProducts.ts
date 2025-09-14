import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallFavoriteProduct } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallFavoriteProduct";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Add a new favorite product
 *
 * This operation creates a new favorite product record for an authenticated
 * member user in the shopping mall system. It accepts product snapshot
 * references and associates the favorite with the member user.
 *
 * @param props - Object containing memberUser payload and favorite product
 *   creation body
 * @param props.memberUser - Authenticated member user making the request
 * @param props.body - Request body containing product snapshot reference for
 *   favorite creation
 * @returns The newly created favorite product entity
 * @throws {Error} Throws error if the creation fails due to database
 *   constraints or other issues
 */
export async function post__shoppingMall_memberUser_favoriteProducts(props: {
  memberUser: MemberuserPayload;
  body: IShoppingMallFavoriteProduct.ICreate;
}): Promise<IShoppingMallFavoriteProduct> {
  const now = toISOStringSafe(new Date());
  const id = v4() as string & tags.Format<"uuid">;

  const created = await MyGlobal.prisma.shopping_mall_favorite_products.create({
    data: {
      id,
      shopping_mall_memberuser_id: props.body.shopping_mall_memberuser_id,
      shopping_mall_sale_snapshot_id: props.body.shopping_mall_sale_snapshot_id,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    },
  });

  return {
    id: created.id,
    shopping_mall_memberuser_id: created.shopping_mall_memberuser_id,
    shopping_mall_sale_snapshot_id: created.shopping_mall_sale_snapshot_id,
    created_at: now,
    updated_at: now,
    deleted_at: null,
  };
}
