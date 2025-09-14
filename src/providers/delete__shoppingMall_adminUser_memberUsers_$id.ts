import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Soft delete a shopping mall member user by setting the deleted_at timestamp.
 *
 * This operation marks the member user as deleted in the database by setting
 * the deleted_at field to the current timestamp. This preserves data integrity
 * and audit trails and prevents the user from appearing in active queries.
 *
 * Access is restricted to administrative users who have permissions to perform
 * this sensitive operation.
 *
 * @param props - Object containing the admin user payload and the ID of the
 *   member user to delete
 * @param props.adminUser - Authenticated administrative user performing the
 *   deletion
 * @param props.id - UUID of the member user to be soft deleted
 * @throws {Error} When the member user does not exist or database update fails
 */
export async function delete__shoppingMall_adminUser_memberUsers_$id(props: {
  adminUser: AdminuserPayload;
  id: string & tags.Format<"uuid">;
}): Promise<void> {
  const { id } = props;

  await MyGlobal.prisma.shopping_mall_memberusers.update({
    where: { id },
    data: {
      deleted_at: toISOStringSafe(new Date()),
    },
  });
}
