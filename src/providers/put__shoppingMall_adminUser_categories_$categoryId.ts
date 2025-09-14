import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallCategory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCategory";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Update product category by ID.
 *
 * This operation updates an existing product category identified by its UUID.
 * The update includes the category's name, status, and description. The
 * category code is immutable and will not be changed.
 *
 * Authorization: requires adminUser authentication.
 *
 * @param props - Object containing admin user information, category ID and
 *   update data
 * @param props.adminUser - Authenticated admin user payload
 * @param props.categoryId - UUID of the category to update
 * @param props.body - Partial update data for the category
 * @returns The fully updated category object
 * @throws {Error} When the category does not exist
 */
export async function put__shoppingMall_adminUser_categories_$categoryId(props: {
  adminUser: AdminuserPayload;
  categoryId: string & tags.Format<"uuid">;
  body: IShoppingMallCategory.IUpdate;
}): Promise<IShoppingMallCategory> {
  const { adminUser, categoryId, body } = props;

  // Validate category existence
  const category =
    await MyGlobal.prisma.shopping_mall_categories.findUniqueOrThrow({
      where: { id: categoryId },
    });

  // Update allowed fields only
  const updated = await MyGlobal.prisma.shopping_mall_categories.update({
    where: { id: categoryId },
    data: {
      name: body.name ?? undefined,
      status: body.status ?? undefined,
      description: body.description ?? undefined,
      updated_at: toISOStringSafe(new Date()),
    },
  });

  return {
    id: updated.id,
    code: updated.code,
    name: updated.name,
    status: updated.status,
    description: updated.description ?? null,
    created_at: toISOStringSafe(updated.created_at),
    updated_at: toISOStringSafe(updated.updated_at),
    deleted_at: updated.deleted_at ? toISOStringSafe(updated.deleted_at) : null,
  };
}
