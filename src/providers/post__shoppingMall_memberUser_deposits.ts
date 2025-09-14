import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallDeposit } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallDeposit";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Creates a new deposit record for an authenticated member user in the shopping
 * mall.
 *
 * This operation stores deposit information, including amounts and validity
 * periods, and maintains audit timestamps. The deposit record is linked to the
 * authenticated member user.
 *
 * @param props - Object containing authenticated memberUser and deposit
 *   creation data.
 * @param props.memberUser - Authenticated member user information.
 * @param props.body - Deposit creation details including deposit amounts and
 *   validity.
 * @returns The newly created deposit record with all relevant fields.
 * @throws {Error} Throws if database operation fails or input data is invalid.
 */
export async function post__shoppingMall_memberUser_deposits(props: {
  memberUser: MemberuserPayload;
  body: IShoppingMallDeposit.ICreate;
}): Promise<IShoppingMallDeposit> {
  const { memberUser, body } = props;
  const id = v4();
  const now = toISOStringSafe(new Date());

  const created = await MyGlobal.prisma.shopping_mall_deposits.create({
    data: {
      id,
      guestuser_id: body.guestuser_id ?? undefined,
      memberuser_id: memberUser.id,
      deposit_amount: body.deposit_amount,
      usable_balance: body.usable_balance,
      deposit_start_at: body.deposit_start_at,
      deposit_end_at: body.deposit_end_at,
      created_at: now,
      updated_at: now,
    },
  });

  return {
    id: created.id,
    guestuser_id: created.guestuser_id ?? null,
    memberuser_id: created.memberuser_id ?? null,
    deposit_amount: created.deposit_amount,
    usable_balance: created.usable_balance,
    deposit_start_at: toISOStringSafe(created.deposit_start_at),
    deposit_end_at: toISOStringSafe(created.deposit_end_at),
    created_at: toISOStringSafe(created.created_at),
    updated_at: toISOStringSafe(created.updated_at),
  };
}
