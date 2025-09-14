import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallCategoryRelations } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCategoryRelations";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Retrieves detailed information for a specific parent category relation by
 * relationId under categoryId.
 *
 * This operation is restricted to admin users. It fetches a single record from
 * shopping_mall_category_relations where the ID matches relationId and the
 * child category matches categoryId, ensuring it has not been soft deleted.
 *
 * @param props - The properties containing adminUser credentials and
 *   identifiers for category and relation.
 * @param props.adminUser - The authenticated admin user making the request.
 * @param props.categoryId - UUID of the child category.
 * @param props.relationId - UUID of the parent category relation.
 * @returns The detailed parent category relation record.
 * @throws {Error} Throws if the relation does not exist or is soft deleted.
 */
export async function get__shoppingMall_adminUser_categories_$categoryId_categoryRelations_parent_$relationId(props: {
  adminUser: AdminuserPayload;
  categoryId: string & tags.Format<"uuid">;
  relationId: string & tags.Format<"uuid">;
}): Promise<IShoppingMallCategoryRelations> {
  const { adminUser, categoryId, relationId } = props;

  const record =
    await MyGlobal.prisma.shopping_mall_category_relations.findFirstOrThrow({
      where: {
        id: relationId,
        child_shopping_mall_category_id: categoryId,
        deleted_at: null,
      },
    });

  return {
    id: record.id,
    parent_shopping_mall_category_id: record.parent_shopping_mall_category_id,
    child_shopping_mall_category_id: record.child_shopping_mall_category_id,
    created_at: toISOStringSafe(record.created_at),
    updated_at: toISOStringSafe(record.updated_at),
    deleted_at: record.deleted_at ? toISOStringSafe(record.deleted_at) : null,
  };
}
