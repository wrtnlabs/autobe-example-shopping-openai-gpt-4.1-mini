import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallFavoriteProduct } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallFavoriteProduct";
import { IPageIShoppingMallFavoriteProduct } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallFavoriteProduct";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Search and retrieve a filtered, paginated list of favorite products.
 *
 * Retrieves favorite products for an authenticated member user with support for
 * advanced filtering, searching, and sorting capabilities.
 *
 * @param props - Object containing authenticated memberUser and filter criteria
 * @param props.memberUser - Authenticated member user payload
 * @param props.body - Request body containing filter, pagination, and sorting
 *   options
 * @returns Paginated list of favorite product summaries matching criteria
 * @throws {Error} When database query fails or invalid parameters are provided
 */
export async function patch__shoppingMall_memberUser_favoriteProducts(props: {
  memberUser: MemberuserPayload;
  body: IShoppingMallFavoriteProduct.IRequest;
}): Promise<IPageIShoppingMallFavoriteProduct.ISummary> {
  const { memberUser, body } = props;

  const page = (body.page ?? 1) > 0 ? (body.page ?? 1) : 1;
  const limit = (body.limit ?? 10) > 0 ? (body.limit ?? 10) : 10;

  const where = {
    deleted_at: null,
    ...(body.shopping_mall_memberuser_id !== undefined &&
      body.shopping_mall_memberuser_id !== null && {
        shopping_mall_memberuser_id: body.shopping_mall_memberuser_id,
      }),
    ...(body.shopping_mall_sale_snapshot_id !== undefined &&
      body.shopping_mall_sale_snapshot_id !== null && {
        shopping_mall_sale_snapshot_id: body.shopping_mall_sale_snapshot_id,
      }),
  };

  const orderBy = body.orderBy
    ? { [body.orderBy]: "asc" as const }
    : { created_at: "desc" as const };

  const [results, total] = await Promise.all([
    MyGlobal.prisma.shopping_mall_favorite_products.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        shopping_mall_memberuser_id: true,
        shopping_mall_sale_snapshot_id: true,
      },
    }),
    MyGlobal.prisma.shopping_mall_favorite_products.count({ where }),
  ]);

  return {
    pagination: {
      current: Number(page),
      limit: Number(limit),
      records: total,
      pages: Math.ceil(total / limit),
    },
    data: results.map((item) => ({
      id: item.id,
      shopping_mall_memberuser_id: item.shopping_mall_memberuser_id,
      shopping_mall_sale_snapshot_id: item.shopping_mall_sale_snapshot_id,
    })),
  };
}
