import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallCategoryRelations } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCategoryRelations";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Update a parent category relation by relation ID under a specified child
 * category.
 *
 * This function updates fields on `shopping_mall_category_relations` identified
 * by `relationId`, ensuring it relates to the child category `categoryId`.
 *
 * Only admin users can perform this update to maintain data integrity.
 *
 * @param props - The properties containing admin user, categoryId, relationId,
 *   and update body.
 * @param props.adminUser - Authenticated admin user making the update request.
 * @param props.categoryId - The UUID of the child category involved in the
 *   relation.
 * @param props.relationId - The UUID identifier of the parent category
 *   relation.
 * @param props.body - The partial update data for the relation.
 * @returns The updated `IShoppingMallCategoryRelations` object including
 *   timestamps.
 * @throws {Error} Throws if the category relation does not exist or if update
 *   fails.
 */
export async function put__shoppingMall_adminUser_categories_$categoryId_categoryRelations_parent_$relationId(props: {
  adminUser: AdminuserPayload;
  categoryId: string & tags.Format<"uuid">;
  relationId: string & tags.Format<"uuid">;
  body: IShoppingMallCategoryRelations.IUpdate;
}): Promise<IShoppingMallCategoryRelations> {
  const { adminUser, categoryId, relationId, body } = props;

  // Find existing relation matching relationId and belonging to child category categoryId
  const existingRelation =
    await MyGlobal.prisma.shopping_mall_category_relations.findFirst({
      where: {
        id: relationId,
        child_shopping_mall_category_id: categoryId,
      },
    });

  if (!existingRelation) {
    throw new Error(
      `Unable to find category relation with relationId ${relationId} and categoryId ${categoryId}`,
    );
  }

  // Prepare update data object with correct date strings and optional fields
  const now = toISOStringSafe(new Date());

  const updateData: IShoppingMallCategoryRelations.IUpdate = {};

  if (body.parent_shopping_mall_category_id !== undefined) {
    updateData.parent_shopping_mall_category_id =
      body.parent_shopping_mall_category_id;
  }
  if (body.child_shopping_mall_category_id !== undefined) {
    updateData.child_shopping_mall_category_id =
      body.child_shopping_mall_category_id;
  }
  if (body.created_at !== undefined) {
    updateData.created_at = body.created_at;
  }
  if (body.updated_at !== undefined) {
    updateData.updated_at = body.updated_at;
  } else {
    updateData.updated_at = now;
  }
  if (body.deleted_at !== undefined) {
    updateData.deleted_at = body.deleted_at;
  }

  // Update the category relation record
  const updatedRelation =
    await MyGlobal.prisma.shopping_mall_category_relations.update({
      where: { id: relationId },
      data: updateData,
    });

  // Return updated record with date values converted and typed accordingly
  return {
    id: updatedRelation.id as string & tags.Format<"uuid">,
    parent_shopping_mall_category_id:
      updatedRelation.parent_shopping_mall_category_id as string &
        tags.Format<"uuid">,
    child_shopping_mall_category_id:
      updatedRelation.child_shopping_mall_category_id as string &
        tags.Format<"uuid">,
    created_at: toISOStringSafe(updatedRelation.created_at),
    updated_at: toISOStringSafe(updatedRelation.updated_at),
    deleted_at: updatedRelation.deleted_at
      ? toISOStringSafe(updatedRelation.deleted_at)
      : null,
  };
}
