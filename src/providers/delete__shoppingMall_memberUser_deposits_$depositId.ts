import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Delete an existing deposit record permanently from the database.
 *
 * This operation performs a hard delete on the shopping_mall_deposits table,
 * removing the deposit record identified by depositId.
 *
 * Only authorized member users owning the deposit can perform this operation.
 *
 * @param props - Object containing memberUser authentication and depositId
 *   parameter
 * @param props.memberUser - Authenticated member user performing the deletion
 * @param props.depositId - UUID of the deposit record to delete
 * @returns Void
 * @throws {Error} When the deposit is not found
 * @throws {Error} When the deposit does not belong to the authenticated member
 *   user
 */
export async function delete__shoppingMall_memberUser_deposits_$depositId(props: {
  memberUser: MemberuserPayload;
  depositId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { memberUser, depositId } = props;

  const deposit = await MyGlobal.prisma.shopping_mall_deposits.findUnique({
    where: { id: depositId },
  });
  if (!deposit) throw new Error(`Deposit not found: ${depositId}`);

  if (deposit.memberuser_id !== memberUser.id) {
    throw new Error(`Unauthorized: Deposit does not belong to the member user`);
  }

  await MyGlobal.prisma.shopping_mall_deposits.delete({
    where: { id: depositId },
  });
}
