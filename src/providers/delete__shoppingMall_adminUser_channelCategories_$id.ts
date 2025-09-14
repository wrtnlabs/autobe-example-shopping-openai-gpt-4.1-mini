import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Removes a channel-category mapping permanently by its unique ID.
 *
 * This operation deletes the association between a sales channel and a product
 * category. Only authorized admin users can perform this action. The deletion
 * is irreversible (hard delete).
 *
 * @param props - Object containing parameters for deletion.
 * @param props.adminUser - Authenticated admin user performing the deletion.
 * @param props.id - Unique UUID of the channel-category mapping to delete.
 * @throws {Error} Throws if the specified ID does not exist or deletion fails.
 */
export async function delete__shoppingMall_adminUser_channelCategories_$id(props: {
  adminUser: AdminuserPayload;
  id: string & tags.Format<"uuid">;
}): Promise<void> {
  const { id } = props;

  await MyGlobal.prisma.shopping_mall_channel_categories.delete({
    where: { id },
  });
}
