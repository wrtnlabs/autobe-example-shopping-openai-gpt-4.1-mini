import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallCategoryRelations } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCategoryRelations";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Update a child category relation under a specific parent category.
 *
 * This operation updates an existing child category relation identified by the
 * 'relationId' path parameter under the specified parent category 'categoryId'.
 * It ensures the new child category exists and the relation belongs to the
 * parent.
 *
 * @param props - Object containing admin user info, parent category ID,
 *   relation ID, and update body
 * @returns The updated category relation entity
 * @throws {Error} When parent category, child category, or relation is not
 *   found
 */
export async function put__shoppingMall_adminUser_categories_$categoryId_categoryRelations_child_$relationId(props: {
  adminUser: AdminuserPayload;
  categoryId: string & tags.Format<"uuid">;
  relationId: string & tags.Format<"uuid">;
  body: IShoppingMallCategoryRelations.IUpdate;
}): Promise<IShoppingMallCategoryRelations> {
  const { adminUser, categoryId, relationId, body } = props;

  // Verify parent category existence
  const parentCategory =
    await MyGlobal.prisma.shopping_mall_categories.findFirst({
      where: {
        id: categoryId,
        deleted_at: null,
      },
    });
  if (!parentCategory) throw new Error("Parent category not found");

  // Verify existing relation with parent
  const existingRelation =
    await MyGlobal.prisma.shopping_mall_category_relations.findFirst({
      where: {
        id: relationId,
        parent_shopping_mall_category_id: categoryId,
        deleted_at: null,
      },
    });
  if (!existingRelation) throw new Error("Category relation not found");

  // Verify new child category existence if provided
  if (body.child_shopping_mall_category_id !== undefined) {
    const childCategory =
      await MyGlobal.prisma.shopping_mall_categories.findFirst({
        where: {
          id: body.child_shopping_mall_category_id,
          deleted_at: null,
        },
      });
    if (!childCategory) throw new Error("Child category not found");
  }

  // Prepare update data
  const updateData: IShoppingMallCategoryRelations.IUpdate = {};
  if (body.child_shopping_mall_category_id !== undefined) {
    updateData.child_shopping_mall_category_id =
      body.child_shopping_mall_category_id;
  }
  updateData.updated_at = toISOStringSafe(new Date());

  // Update relation
  const updated = await MyGlobal.prisma.shopping_mall_category_relations.update(
    {
      where: { id: relationId },
      data: updateData,
    },
  );

  // Return updated object with date fields converted
  return {
    id: updated.id,
    parent_shopping_mall_category_id: updated.parent_shopping_mall_category_id,
    child_shopping_mall_category_id: updated.child_shopping_mall_category_id,
    created_at: toISOStringSafe(updated.created_at),
    updated_at: toISOStringSafe(updated.updated_at),
    deleted_at: updated.deleted_at ? toISOStringSafe(updated.deleted_at) : null,
  };
}
