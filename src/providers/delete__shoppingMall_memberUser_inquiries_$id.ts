import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Delete a product inquiry by ID, permanently removing it from the system.
 *
 * The inquiry is a customer question or comment linked to a product. Deletion
 * is only allowed to authorized personnel.
 *
 * This operation performs a hard deletion, removing the entry completely from
 * the shopping_mall_inquiries table.
 *
 * No request body is needed.
 *
 * Ensure proper authorization before executing.
 *
 * @param props - Object containing memberUser (authenticated user) and inquiry
 *   id
 * @param props.memberUser - Authenticated member user performing the deletion
 * @param props.id - UUID of the inquiry to delete
 * @returns Void
 * @throws {Error} Unauthorized if the member user does not own the inquiry
 * @throws {Error} When the inquiry with the provided ID does not exist
 */
export async function delete__shoppingMall_memberUser_inquiries_$id(props: {
  memberUser: MemberuserPayload;
  id: string & tags.Format<"uuid">;
}): Promise<void> {
  const { memberUser, id } = props;

  const inquiry =
    await MyGlobal.prisma.shopping_mall_inquiries.findUniqueOrThrow({
      where: { id },
    });

  if (inquiry.shopping_mall_memberuserid !== memberUser.id) {
    throw new Error("Unauthorized: You can only delete your own inquiries");
  }

  await MyGlobal.prisma.shopping_mall_inquiries.delete({
    where: { id },
  });
}
