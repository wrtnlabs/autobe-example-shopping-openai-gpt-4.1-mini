import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Deletes an existing deposit charge application permanently from the database.
 *
 * This operation performs a hard delete of the deposit charge record identified
 * by `depositChargeId`. Only the owning authenticated member user can delete
 * their deposit charge.
 *
 * @param props - The properties containing the authenticated member user and
 *   the deposit charge ID
 * @param props.memberUser - The authenticated member user's payload
 * @param props.depositChargeId - The UUID of the deposit charge to delete
 * @throws {Error} When the deposit charge does not exist or does not belong to
 *   the authenticated member user
 */
export async function delete__shoppingMall_memberUser_depositCharges_$depositChargeId(props: {
  memberUser: MemberuserPayload;
  depositChargeId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { memberUser, depositChargeId } = props;

  const depositCharge =
    await MyGlobal.prisma.shopping_mall_deposit_charges.findUnique({
      where: { id: depositChargeId },
    });

  if (!depositCharge || depositCharge.memberuser_id !== memberUser.id) {
    throw new Error("Unauthorized or deposit charge not found");
  }

  await MyGlobal.prisma.shopping_mall_deposit_charges.delete({
    where: { id: depositChargeId },
  });
}
