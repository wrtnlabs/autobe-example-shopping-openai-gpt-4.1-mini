import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Deletes a product category permanently by its UUID from the shopping mall
 * system.
 *
 * This operation performs a hard delete on the database record in
 * shopping_mall_categories, permanently removing the category and associated
 * data through database cascade (if any).
 *
 * Only authorized admin users should execute this operation to prevent
 * unauthorized data loss.
 *
 * @param props - Object containing the admin user payload and the UUID of the
 *   category to delete
 * @param props.adminUser - The authenticated admin user performing the deletion
 * @param props.categoryId - The UUID of the category to be deleted
 * @returns Promise<void> - Resolves when deletion is successful
 * @throws {Error} - Throws if the category does not exist or if deletion
 *   violates relational integrity
 */
export async function delete__shoppingMall_adminUser_categories_$categoryId(props: {
  adminUser: AdminuserPayload;
  categoryId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { adminUser, categoryId } = props;

  // Ensure category exists, else throw
  await MyGlobal.prisma.shopping_mall_categories.findUniqueOrThrow({
    where: { id: categoryId },
  });

  await MyGlobal.prisma.shopping_mall_categories.delete({
    where: { id: categoryId },
  });
}
