import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallCategoryRelations } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCategoryRelations";
import { IPageIShoppingMallCategoryRelations } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallCategoryRelations";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

export async function patch__shoppingMall_adminUser_categories_$categoryId_categoryRelations_parent(props: {
  adminUser: AdminuserPayload;
  categoryId: string & tags.Format<"uuid">;
  body: IShoppingMallCategoryRelations.IRequest;
}): Promise<IPageIShoppingMallCategoryRelations.ISummary> {
  const { adminUser, categoryId, body } = props;

  const category = await MyGlobal.prisma.shopping_mall_categories.findUnique({
    where: { id: categoryId },
  });
  if (!category) throw new Error(`Category not found: ${categoryId}`);

  const where = {
    deleted_at: null,
    child_shopping_mall_category_id: categoryId,
    ...(body.categoryId !== undefined &&
      body.categoryId !== null && {
        parent_shopping_mall_category_id: body.categoryId,
      }),
    ...(body.parent_shopping_mall_category_id !== undefined &&
      body.parent_shopping_mall_category_id !== null && {
        parent_shopping_mall_category_id: body.parent_shopping_mall_category_id,
      }),
    ...(body.child_shopping_mall_category_id !== undefined &&
      body.child_shopping_mall_category_id !== null && {
        child_shopping_mall_category_id: body.child_shopping_mall_category_id,
      }),
    ...((body.created_at_from !== undefined && body.created_at_from !== null) ||
    (body.created_at_to !== undefined && body.created_at_to !== null)
      ? {
          created_at: {
            ...(body.created_at_from !== undefined &&
              body.created_at_from !== null && { gte: body.created_at_from }),
            ...(body.created_at_to !== undefined &&
              body.created_at_to !== null && { lte: body.created_at_to }),
          },
        }
      : {}),
    ...((body.updated_at_from !== undefined && body.updated_at_from !== null) ||
    (body.updated_at_to !== undefined && body.updated_at_to !== null)
      ? {
          updated_at: {
            ...(body.updated_at_from !== undefined &&
              body.updated_at_from !== null && { gte: body.updated_at_from }),
            ...(body.updated_at_to !== undefined &&
              body.updated_at_to !== null && { lte: body.updated_at_to }),
          },
        }
      : {}),
  };

  const page = body.page ?? 1;
  const limit = body.limit ?? 20;
  const skip = (page - 1) * limit;

  const [data, total] = await Promise.all([
    MyGlobal.prisma.shopping_mall_category_relations.findMany({
      where,
      orderBy: { [body.sort ?? "created_at"]: "desc" },
      skip,
      take: limit,
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
    data: data.map((item) => ({
      id: item.id,
      parent_shopping_mall_category_id: item.parent_shopping_mall_category_id,
      child_shopping_mall_category_id: item.child_shopping_mall_category_id,
      created_at: toISOStringSafe(item.created_at),
      updated_at: toISOStringSafe(item.updated_at),
    })),
  };
}
