import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallCategory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCategory";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Retrieve product category by ID
 *
 * Retrieves detailed product category data including code, status, and
 * timestamps. Only accessible by authenticated adminUser.
 *
 * @param props - Object containing the authenticated adminUser and the category
 *   ID
 * @param props.adminUser - Authenticated admin user making the request
 * @param props.categoryId - UUID of the product category to retrieve
 * @returns The full product category record
 * @throws {Error} Throws an error if the category is not found or soft-deleted
 */
export async function get__shoppingMall_adminUser_categories_$categoryId(props: {
  adminUser: AdminuserPayload;
  categoryId: string & tags.Format<"uuid">;
}): Promise<IShoppingMallCategory> {
  const { adminUser, categoryId } = props;

  const category =
    await MyGlobal.prisma.shopping_mall_categories.findFirstOrThrow({
      where: {
        id: categoryId,
        deleted_at: null,
      },
    });

  return {
    id: category.id,
    code: category.code,
    name: category.name,
    status: category.status,
    description: category.description ?? null,
    created_at: toISOStringSafe(category.created_at),
    updated_at: toISOStringSafe(category.updated_at),
    deleted_at: category.deleted_at
      ? toISOStringSafe(category.deleted_at)
      : null,
  };
}
