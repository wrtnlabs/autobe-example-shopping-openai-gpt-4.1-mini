import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Permanently delete an attachment by ID
 *
 * This function removes the attachment record from the database entirely. Only
 * an authenticated member user may perform this action.
 *
 * @param props - Object containing the authenticated member user and the ID of
 *   the attachment to delete
 * @param props.memberUser - The authenticated member user executing the delete
 * @param props.id - UUID string identifying the attachment to delete
 * @returns Void
 * @throws {Error} Throws if attachment not found
 */
export async function delete__shoppingMall_memberUser_attachments_$id(props: {
  memberUser: MemberuserPayload;
  id: string & tags.Format<"uuid">;
}): Promise<void> {
  const { memberUser, id } = props;

  // Check ownership or permissions if business rules require (not specified here)

  // Verify the attachment exists or throw error
  await MyGlobal.prisma.shopping_mall_attachments.findUniqueOrThrow({
    where: { id },
  });

  // Permanently delete the attachment
  await MyGlobal.prisma.shopping_mall_attachments.delete({ where: { id } });
}
