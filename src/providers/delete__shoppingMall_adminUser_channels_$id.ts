import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Delete a sales channel from the shopping mall platform identified by its
 * UUID.
 *
 * Soft deletes by setting the deleted_at timestamp. Requires adminUser
 * authorization.
 *
 * @param props - Object containing the adminUser payload and channel id
 * @param props.adminUser - The authenticated admin user performing the deletion
 * @param props.id - UUID of the sales channel to delete
 * @returns Promise<void>
 * @throws {Error} Throws if the channel does not exist or is already deleted
 */
export async function delete__shoppingMall_adminUser_channels_$id(props: {
  adminUser: AdminuserPayload;
  id: string & tags.Format<"uuid">;
}): Promise<void> {
  const { adminUser, id } = props;

  // Verify that the channel exists and is not already deleted
  await MyGlobal.prisma.shopping_mall_channels.findFirstOrThrow({
    where: { id, deleted_at: null },
  });

  // Perform soft delete by setting deleted_at timestamp
  await MyGlobal.prisma.shopping_mall_channels.update({
    where: { id },
    data: {
      deleted_at: toISOStringSafe(new Date()),
    },
  });
}
