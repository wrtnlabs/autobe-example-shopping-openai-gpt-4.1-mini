import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Delete a child category relation under a specific parent category.
 *
 * This operation permanently removes the hierarchical link between two
 * categories in the 'shopping_mall_category_relations' table.
 *
 * Only authorized admin users can perform this operation.
 *
 * @param props - Parameters including admin user payload, parent category ID,
 *   and relation ID
 * @param props.adminUser - The authenticated admin user performing the
 *   operation
 * @param props.categoryId - UUID of the parent category
 * @param props.relationId - UUID of the child category relation to delete
 * @returns Void
 * @throws {Error} If the relation does not belong to the specified parent
 *   category
 * @throws {Error} If the relation is not found
 */
export async function delete__shoppingMall_adminUser_categories_$categoryId_categoryRelations_child_$relationId(props: {
  adminUser: AdminuserPayload;
  categoryId: string & tags.Format<"uuid">;
  relationId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { adminUser, categoryId, relationId } = props;

  const relation =
    await MyGlobal.prisma.shopping_mall_category_relations.findUniqueOrThrow({
      where: { id: relationId },
    });

  if (relation.parent_shopping_mall_category_id !== categoryId) {
    throw new Error(
      "The relation does not belong to the specified parent category.",
    );
  }

  await MyGlobal.prisma.shopping_mall_category_relations.delete({
    where: { id: relationId },
  });
}
