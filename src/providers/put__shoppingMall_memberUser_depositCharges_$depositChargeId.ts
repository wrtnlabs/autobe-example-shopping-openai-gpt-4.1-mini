import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallDepositCharge } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallDepositCharge";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Update an existing deposit charge application.
 *
 * This operation modifies charge details, statuses, payment information, and
 * timestamps. It enforces authorization by verifying the record belongs to the
 * authenticated member user.
 *
 * @param props - The parameters including authenticated member user, deposit
 *   charge ID, and update body.
 * @param props.memberUser - The authenticated member user performing this
 *   operation.
 * @param props.depositChargeId - UUID of the deposit charge record to update.
 * @param props.body - Partial update data for deposit charge.
 * @returns The updated deposit charge record reflecting the latest state.
 * @throws {Error} When the deposit charge record is not found.
 * @throws {Error} When the authenticated user is not authorized to update this
 *   record.
 */
export async function put__shoppingMall_memberUser_depositCharges_$depositChargeId(props: {
  memberUser: MemberuserPayload;
  depositChargeId: string & tags.Format<"uuid">;
  body: IShoppingMallDepositCharge.IUpdate;
}): Promise<IShoppingMallDepositCharge> {
  const { memberUser, depositChargeId, body } = props;

  const depositCharge =
    await MyGlobal.prisma.shopping_mall_deposit_charges.findUnique({
      where: { id: depositChargeId },
    });

  if (!depositCharge) throw new Error("Deposit charge record not found");

  if (depositCharge.memberuser_id !== memberUser.id) {
    throw new Error(
      "Unauthorized: deposit charge does not belong to this member user",
    );
  }

  const updated = await MyGlobal.prisma.shopping_mall_deposit_charges.update({
    where: { id: depositChargeId },
    data: {
      guestuser_id:
        body.guestuser_id === null ? null : (body.guestuser_id ?? undefined),
      memberuser_id:
        body.memberuser_id === null ? null : (body.memberuser_id ?? undefined),
      charge_amount: body.charge_amount ?? undefined,
      charge_status: body.charge_status ?? undefined,
      payment_provider: body.payment_provider ?? undefined,
      payment_account: body.payment_account ?? undefined,
      paid_at: body.paid_at === null ? null : (body.paid_at ?? undefined),
    },
  });

  return {
    id: updated.id,
    guestuser_id: updated.guestuser_id ?? undefined,
    memberuser_id: updated.memberuser_id ?? undefined,
    charge_amount: updated.charge_amount,
    charge_status: updated.charge_status,
    payment_provider: updated.payment_provider,
    payment_account: updated.payment_account,
    paid_at: updated.paid_at ? toISOStringSafe(updated.paid_at) : null,
    created_at: toISOStringSafe(updated.created_at),
    updated_at: toISOStringSafe(updated.updated_at),
  };
}
