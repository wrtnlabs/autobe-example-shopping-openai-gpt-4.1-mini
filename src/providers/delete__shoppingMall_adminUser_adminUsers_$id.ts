import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Delete an administrator user by ID
 *
 * This operation permanently removes an administrator user record from the
 * shopping_mall_adminusers table. The user must exist, and the caller must be
 * authenticated as an adminUser.
 *
 * @param props - Object containing adminUser authorization and the target user
 *   ID
 * @param props.adminUser - The authenticated admin user performing this action
 * @param props.id - The UUID of the administrator user to delete
 * @throws {Error} Throws if the user does not exist or if deletion fails
 */
export async function delete__shoppingMall_adminUser_adminUsers_$id(props: {
  adminUser: AdminuserPayload;
  id: string & tags.Format<"uuid">;
}): Promise<void> {
  const { adminUser, id } = props;

  // Verify that the admin user exists with the specified id
  await MyGlobal.prisma.shopping_mall_adminusers.findUniqueOrThrow({
    where: { id },
  });

  // Perform hard delete of the administrator user
  await MyGlobal.prisma.shopping_mall_adminusers.delete({
    where: { id },
  });
}
