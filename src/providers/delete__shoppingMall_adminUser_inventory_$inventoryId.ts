import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Delete inventory record by ID
 *
 * Permanently deletes a specific inventory record identified by its UUID. This
 * operation performs a hard delete removing the record from the database, even
 * though the table supports soft deletion fields.
 *
 * This endpoint is accessible only to adminUser role.
 *
 * @param props - Object containing adminUser authentication and inventory ID
 * @param props.adminUser - Authenticated admin user
 * @param props.inventoryId - Unique identifier of the inventory record to
 *   delete
 * @returns Void
 * @throws {Error} Throws error if the inventory record is not found
 */
export async function delete__shoppingMall_adminUser_inventory_$inventoryId(props: {
  adminUser: AdminuserPayload;
  inventoryId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { adminUser, inventoryId } = props;

  // Verify inventory exists or throw
  await MyGlobal.prisma.shopping_mall_inventory.findUniqueOrThrow({
    where: { id: inventoryId },
  });

  // Hard delete the inventory record
  await MyGlobal.prisma.shopping_mall_inventory.delete({
    where: { id: inventoryId },
  });
}
