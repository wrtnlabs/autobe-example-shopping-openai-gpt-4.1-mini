import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Delete a parent category relation by relation ID for a given child category
 * ID.
 *
 * This operation deletes the linkage record permanently from the
 * shopping_mall_category_relations table. Requires adminUser authentication.
 *
 * @param props - Object containing adminUser, categoryId (child), and
 *   relationId (parent relation record)
 * @throws {Error} When the specified relation is not found or does not belong
 *   to the child category
 */
export async function delete__shoppingMall_adminUser_categories_$categoryId_categoryRelations_parent_$relationId(props: {
  adminUser: AdminuserPayload;
  categoryId: string & tags.Format<"uuid">;
  relationId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { adminUser, categoryId, relationId } = props;

  // Verify existence and correct child category linkage
  const relation =
    await MyGlobal.prisma.shopping_mall_category_relations.findUnique({
      where: { id: relationId },
    });

  if (
    relation === null ||
    relation.child_shopping_mall_category_id !== categoryId
  ) {
    throw new Error(
      "Relation not found or relation does not belong to the specified category",
    );
  }

  // Delete the relation permanently
  await MyGlobal.prisma.shopping_mall_category_relations.delete({
    where: { id: relationId },
  });
}
