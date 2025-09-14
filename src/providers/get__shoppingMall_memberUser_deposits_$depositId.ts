import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallDeposit } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallDeposit";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Retrieve detailed information for a single deposit record identified by
 * depositId.
 *
 * Requires authenticated 'memberUser' role for access. Returns deposit amount,
 * usable balance, validity period, and timestamps.
 *
 * @param props - Object containing the authenticated member user and deposit ID
 * @param props.memberUser - Authenticated member user making the request
 * @param props.depositId - Unique identifier of the target deposit record
 * @returns Detailed deposit record of type IShoppingMallDeposit
 * @throws {Error} If deposit is not found or does not belong to the member user
 * @throws {Error} On unauthorized access attempt
 */
export async function get__shoppingMall_memberUser_deposits_$depositId(props: {
  memberUser: MemberuserPayload;
  depositId: string & tags.Format<"uuid">;
}): Promise<IShoppingMallDeposit> {
  const { memberUser, depositId } = props;

  const record = await MyGlobal.prisma.shopping_mall_deposits.findUniqueOrThrow(
    {
      where: { id: depositId },
    },
  );

  if (record.memberuser_id !== memberUser.id) {
    throw new Error(
      "Unauthorized: Deposit does not belong to the authenticated member user",
    );
  }

  return {
    id: record.id,
    guestuser_id: record.guestuser_id ?? null,
    memberuser_id: record.memberuser_id ?? null,
    deposit_amount: record.deposit_amount,
    usable_balance: record.usable_balance,
    deposit_start_at: toISOStringSafe(record.deposit_start_at),
    deposit_end_at: toISOStringSafe(record.deposit_end_at),
    created_at: toISOStringSafe(record.created_at),
    updated_at: toISOStringSafe(record.updated_at),
  };
}
