import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Remove a product section permanently by ID.
 *
 * This operation permanently deletes the spatial section identified by the
 * given UUID. Only users authenticated as adminUser have permission to perform
 * this action.
 *
 * @param props - Object containing the adminUser payload and the ID of the
 *   section to delete.
 * @param props.adminUser - Authenticated adminUser performing the deletion.
 * @param props.id - Unique identifier of the section to be deleted.
 * @returns Promise<void> with no return value.
 * @throws {Error} Throws if the section does not exist or deletion fails due to
 *   FK constraints or DB errors.
 */
export async function delete__shoppingMall_adminUser_sections_$id(props: {
  adminUser: AdminuserPayload;
  id: string & tags.Format<"uuid">;
}): Promise<void> {
  const { adminUser, id } = props;

  // Verify section exists
  await MyGlobal.prisma.shopping_mall_sections.findUniqueOrThrow({
    where: { id },
  });

  // Hard delete the section
  await MyGlobal.prisma.shopping_mall_sections.delete({
    where: { id },
  });
}
