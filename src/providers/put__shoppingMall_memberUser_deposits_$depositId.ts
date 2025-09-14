import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallDeposit } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallDeposit";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Update an existing deposit record in the shopping mall system associated with
 * the authenticated member user.
 *
 * This function checks that the deposit record exists and belongs to the
 * authenticated member user before applying updates. It only updates fields
 * provided in the input body and sets the updated_at timestamp to the current
 * time.
 *
 * @param props - Object containing memberUser authentication, depositId to
 *   identify the deposit, and body with deposit fields to update.
 * @param props.memberUser - The authenticated member user's payload.
 * @param props.depositId - The UUID of the deposit record to update.
 * @param props.body - Partial deposit update data.
 * @returns The updated deposit entity with all fields, including timestamps,
 *   converted to ISO string formats.
 * @throws {Error} Throws if the deposit does not belong to the member user or
 *   if it does not exist.
 */
export async function put__shoppingMall_memberUser_deposits_$depositId(props: {
  memberUser: MemberuserPayload;
  depositId: string & tags.Format<"uuid">;
  body: IShoppingMallDeposit.IUpdate;
}): Promise<IShoppingMallDeposit> {
  const { memberUser, depositId, body } = props;

  const deposit =
    await MyGlobal.prisma.shopping_mall_deposits.findUniqueOrThrow({
      where: { id: depositId },
    });

  if (deposit.memberuser_id !== memberUser.id) {
    throw new Error(
      "Unauthorized: You can only update your own deposit records.",
    );
  }

  const updated = await MyGlobal.prisma.shopping_mall_deposits.update({
    where: { id: depositId },
    data: {
      guestuser_id: body.guestuser_id ?? undefined,
      memberuser_id: body.memberuser_id ?? undefined,
      deposit_amount: body.deposit_amount ?? undefined,
      usable_balance: body.usable_balance ?? undefined,
      deposit_start_at: body.deposit_start_at
        ? toISOStringSafe(body.deposit_start_at)
        : undefined,
      deposit_end_at: body.deposit_end_at
        ? toISOStringSafe(body.deposit_end_at)
        : undefined,
      updated_at: toISOStringSafe(new Date()),
    },
  });

  return {
    id: updated.id,
    guestuser_id: updated.guestuser_id ?? null,
    memberuser_id: updated.memberuser_id ?? null,
    deposit_amount: updated.deposit_amount,
    usable_balance: updated.usable_balance,
    deposit_start_at: toISOStringSafe(updated.deposit_start_at),
    deposit_end_at: toISOStringSafe(updated.deposit_end_at),
    created_at: toISOStringSafe(updated.created_at),
    updated_at: toISOStringSafe(updated.updated_at),
  };
}
