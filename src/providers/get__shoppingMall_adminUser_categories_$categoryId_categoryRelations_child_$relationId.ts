import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallCategoryRelations } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCategoryRelations";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Get specific child category relation detail by relation ID
 *
 * Retrieves detailed information about a specific child category relation
 * identified by relationId where the category identified by categoryId is the
 * parent. Only accessible to authorized admin users.
 *
 * @param props - Object containing authorization and path parameters
 * @param props.adminUser - Authenticated admin user payload
 * @param props.categoryId - UUID string identifying the parent category
 * @param props.relationId - UUID string identifying the child category relation
 * @returns Detailed object of the child category relation
 * @throws Error if relation not found or query fails
 */
export async function get__shoppingMall_adminUser_categories_$categoryId_categoryRelations_child_$relationId(props: {
  adminUser: AdminuserPayload;
  categoryId: string & tags.Format<"uuid">;
  relationId: string & tags.Format<"uuid">;
}): Promise<IShoppingMallCategoryRelations> {
  const { adminUser, categoryId, relationId } = props;

  const record =
    await MyGlobal.prisma.shopping_mall_category_relations.findUniqueOrThrow({
      where: {
        id: relationId,
        parent_shopping_mall_category_id: categoryId,
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
