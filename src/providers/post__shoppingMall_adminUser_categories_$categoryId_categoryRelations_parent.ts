import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallCategoryRelations } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCategoryRelations";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Create a new parent category relation for the category identified by
 * categoryId.
 *
 * This inserts a new record into the shopping_mall_category_relations table
 * linking parent and child categories.
 *
 * Only admin users can perform this operation.
 *
 * @param props - Object containing adminUser authentication, categoryId path
 *   parameter, and request body with parent-child relation identifiers.
 * @returns The created parent category relation object with timestamps.
 * @throws {Error} When child's categoryId in body does not match path
 *   parameter.
 */
export async function post__shoppingMall_adminUser_categories_$categoryId_categoryRelations_parent(props: {
  adminUser: AdminuserPayload;
  categoryId: string & tags.Format<"uuid">;
  body: IShoppingMallCategoryRelations.ICreate;
}): Promise<IShoppingMallCategoryRelations> {
  const { adminUser, categoryId, body } = props;

  if (body.child_shopping_mall_category_id !== categoryId) {
    throw new Error(
      "child_shopping_mall_category_id in body must match categoryId parameter",
    );
  }

  const now = toISOStringSafe(new Date());

  const created = await MyGlobal.prisma.shopping_mall_category_relations.create(
    {
      data: {
        id: v4(),
        parent_shopping_mall_category_id: body.parent_shopping_mall_category_id,
        child_shopping_mall_category_id: body.child_shopping_mall_category_id,
        created_at: now,
        updated_at: now,
      },
    },
  );

  return {
    id: created.id,
    parent_shopping_mall_category_id: created.parent_shopping_mall_category_id,
    child_shopping_mall_category_id: created.child_shopping_mall_category_id,
    created_at: toISOStringSafe(created.created_at),
    updated_at: toISOStringSafe(created.updated_at),
    deleted_at: created.deleted_at ? toISOStringSafe(created.deleted_at) : null,
  };
}
