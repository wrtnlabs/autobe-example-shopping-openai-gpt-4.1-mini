import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallDepositCharge } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallDepositCharge";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Retrieve deposit charge application details by id for authenticated member
 * user.
 *
 * This endpoint fetches a deposit charge record only if it belongs to the
 * authenticated member user, ensuring authorization and data privacy.
 *
 * @param props - Object containing memberUser auth payload and depositChargeId
 *   path param
 * @param props.memberUser - Authenticated member user making the request
 * @param props.depositChargeId - UUID of the deposit charge to retrieve
 * @returns The full deposit charge record with all relevant fields
 * @throws {Error} If the deposit charge does not exist or access is
 *   unauthorized
 */
export async function get__shoppingMall_memberUser_depositCharges_$depositChargeId(props: {
  memberUser: MemberuserPayload;
  depositChargeId: string & tags.Format<"uuid">;
}): Promise<IShoppingMallDepositCharge> {
  const { memberUser, depositChargeId } = props;

  const depositCharge =
    await MyGlobal.prisma.shopping_mall_deposit_charges.findUniqueOrThrow({
      where: { id: depositChargeId },
    });

  if (depositCharge.memberuser_id !== memberUser.id) {
    throw new Error(
      "Unauthorized access: This deposit charge does not belong to the authenticated member user.",
    );
  }

  return {
    id: depositCharge.id,
    guestuser_id: depositCharge.guestuser_id ?? undefined,
    memberuser_id: depositCharge.memberuser_id ?? undefined,
    charge_amount: depositCharge.charge_amount,
    charge_status: depositCharge.charge_status,
    payment_provider: depositCharge.payment_provider,
    payment_account: depositCharge.payment_account,
    paid_at: depositCharge.paid_at
      ? toISOStringSafe(depositCharge.paid_at)
      : null,
    created_at: toISOStringSafe(depositCharge.created_at),
    updated_at: toISOStringSafe(depositCharge.updated_at),
  };
}
