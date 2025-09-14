import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallCategoryRelations } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCategoryRelations";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Creates a new child category relation under a specified parent category.
 *
 * This operation verifies that both the parent and child categories exist and
 * are not soft deleted. It also ensures that a duplicate parent-child relation
 * does not already exist. Upon success, it creates the new relation and returns
 * it with all relevant date fields properly formatted.
 *
 * @param props - An object containing authentication and request data
 * @param props.adminUser - The authenticated administrative user payload
 * @param props.categoryId - UUID of the parent category under which the child
 *   relation is to be created
 * @param props.body - Data required to create the child category relation,
 *   including the child category ID
 * @returns The created category relation entity with audit timestamps
 * @throws {Error} If the parent or child category does not exist or has been
 *   soft deleted
 * @throws {Error} If a duplicate relation already exists
 */
export async function post__shoppingMall_adminUser_categories_$categoryId_categoryRelations_child(props: {
  adminUser: AdminuserPayload;
  categoryId: string & tags.Format<"uuid">;
  body: IShoppingMallCategoryRelations.ICreate;
}): Promise<IShoppingMallCategoryRelations> {
  const { adminUser, categoryId, body } = props;

  const parentCategory =
    await MyGlobal.prisma.shopping_mall_categories.findFirst({
      where: { id: categoryId, deleted_at: null },
    });

  if (!parentCategory) {
    throw new Error(
      `Parent category with id ${categoryId} not found or deleted`,
    );
  }

  const childCategory =
    await MyGlobal.prisma.shopping_mall_categories.findFirst({
      where: { id: body.child_shopping_mall_category_id, deleted_at: null },
    });

  if (!childCategory) {
    throw new Error(
      `Child category with id ${body.child_shopping_mall_category_id} not found or deleted`,
    );
  }

  const existingRelation =
    await MyGlobal.prisma.shopping_mall_category_relations.findFirst({
      where: {
        parent_shopping_mall_category_id: categoryId,
        child_shopping_mall_category_id: body.child_shopping_mall_category_id,
        deleted_at: null,
      },
    });

  if (existingRelation) {
    throw new Error(
      "Duplicate relation: This parent-child category relation already exists",
    );
  }

  const now = toISOStringSafe(new Date());
  const newRelation =
    await MyGlobal.prisma.shopping_mall_category_relations.create({
      data: {
        id: v4() as string & tags.Format<"uuid">,
        parent_shopping_mall_category_id: categoryId,
        child_shopping_mall_category_id: body.child_shopping_mall_category_id,
        created_at: now,
        updated_at: now,
      },
    });

  return {
    id: newRelation.id,
    parent_shopping_mall_category_id:
      newRelation.parent_shopping_mall_category_id,
    child_shopping_mall_category_id:
      newRelation.child_shopping_mall_category_id,
    created_at: toISOStringSafe(newRelation.created_at),
    updated_at: toISOStringSafe(newRelation.updated_at),
    deleted_at: newRelation.deleted_at
      ? toISOStringSafe(newRelation.deleted_at)
      : null,
  };
}
