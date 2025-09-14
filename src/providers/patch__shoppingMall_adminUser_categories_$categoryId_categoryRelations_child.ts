import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallCategoryRelations } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCategoryRelations";
import { IPageIShoppingMallCategoryRelations } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallCategoryRelations";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

export async function patch__shoppingMall_adminUser_categories_$categoryId_categoryRelations_child(props: {
  adminUser: AdminuserPayload;
  categoryId: string & tags.Format<"uuid">;
  body: IShoppingMallCategoryRelations.IRequest;
}): Promise<IPageIShoppingMallCategoryRelations.ISummary> {
  const { adminUser, categoryId, body } = props;

  const page = body.page ?? 1;
  const limit = body.limit ?? 10;
  const skip = (page - 1) * limit;

  const where = {
    parent_shopping_mall_category_id: categoryId,
    ...(body.child_shopping_mall_category_id !== undefined &&
      body.child_shopping_mall_category_id !== null && {
        child_shopping_mall_category_id: body.child_shopping_mall_category_id,
      }),
    ...((body.created_at_from !== undefined && body.created_at_from !== null) ||
    (body.created_at_to !== undefined && body.created_at_to !== null)
      ? {
          created_at: {
            ...(body.created_at_from !== undefined &&
            body.created_at_from !== null
              ? { gte: body.created_at_from }
              : {}),
            ...(body.created_at_to !== undefined && body.created_at_to !== null
              ? { lte: body.created_at_to }
              : {}),
          },
        }
      : {}),
    ...((body.updated_at_from !== undefined && body.updated_at_from !== null) ||
    (body.updated_at_to !== undefined && body.updated_at_to !== null)
      ? {
          updated_at: {
            ...(body.updated_at_from !== undefined &&
            body.updated_at_from !== null
              ? { gte: body.updated_at_from }
              : {}),
            ...(body.updated_at_to !== undefined && body.updated_at_to !== null
              ? { lte: body.updated_at_to }
              : {}),
          },
        }
      : {}),
    ...(body.deleted_at === true ? { deleted_at: { not: null } } : {}),
    ...(body.deleted_at === false ? { deleted_at: null } : {}),
  };

  const orderBy =
    body.sort === "created_at_asc"
      ? { created_at: "asc" as const }
      : { created_at: "desc" as const };

  const [records, total] = await Promise.all([
    MyGlobal.prisma.shopping_mall_category_relations.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      select: {
        id: true,
        parent_shopping_mall_category_id: true,
        child_shopping_mall_category_id: true,
        created_at: true,
        updated_at: true,
      },
    }),
    MyGlobal.prisma.shopping_mall_category_relations.count({ where }),
  ]);

  return {
    pagination: {
      current: Number(page),
      limit: Number(limit),
      records: total,
      pages: Math.ceil(total / limit),
    },
    data: records.map((r) => ({
      id: r.id,
      parent_shopping_mall_category_id: r.parent_shopping_mall_category_id,
      child_shopping_mall_category_id: r.child_shopping_mall_category_id,
      created_at: toISOStringSafe(r.created_at),
      updated_at: toISOStringSafe(r.updated_at),
    })),
  };
}
