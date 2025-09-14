import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Delete guest user session permanently by ID
 *
 * AdminUser role required to perform this operation. This operation fully
 * deletes the guest user record from database.
 *
 * @param props - Object containing adminUser credentials and guest user session
 *   id
 * @param props.adminUser - Authenticated admin user performing the operation
 * @param props.id - UUID of the guest user session to delete
 * @returns Void
 * @throws {Error} Throws if the record does not exist or deletion fails
 */
export async function delete__shoppingMall_adminUser_guestUsers_$id(props: {
  adminUser: AdminuserPayload;
  id: string & tags.Format<"uuid">;
}): Promise<void> {
  const { adminUser, id } = props;

  await MyGlobal.prisma.shopping_mall_guestusers.delete({
    where: { id },
  });
}
