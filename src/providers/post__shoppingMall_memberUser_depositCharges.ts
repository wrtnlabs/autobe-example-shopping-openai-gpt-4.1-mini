import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallDepositCharge } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallDepositCharge";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Create a new deposit charge application in the shopping mall system.
 *
 * This function creates a deposit charge record associated with the
 * authenticated member user. It captures payment details including charge
 * amount, payment provider, payment account, and status. Dates are managed with
 * strict ISO string formats, and UUIDs are properly generated and branded.
 *
 * @param props - Contains the authenticated memberUser and the deposit charge
 *   creation data
 * @param props.memberUser - Authenticated memberUser payload containing user ID
 * @param props.body - The creation data for the new deposit charge
 * @returns The newly created deposit charge record including metadata and
 *   timestamps
 * @throws {Error} Throws on any database or system error during creation
 */
export async function post__shoppingMall_memberUser_depositCharges(props: {
  memberUser: MemberuserPayload;
  body: IShoppingMallDepositCharge.ICreate;
}): Promise<IShoppingMallDepositCharge> {
  const { memberUser, body } = props;
  const now = toISOStringSafe(new Date());
  const created = await MyGlobal.prisma.shopping_mall_deposit_charges.create({
    data: {
      id: v4() as string & tags.Format<"uuid">,
      memberuser_id: memberUser.id,
      guestuser_id: body.guestuser_id ?? undefined,
      charge_amount: body.charge_amount,
      charge_status: body.charge_status,
      payment_provider: body.payment_provider,
      payment_account: body.payment_account,
      paid_at: body.paid_at ? toISOStringSafe(body.paid_at) : null,
      created_at: now,
      updated_at: now,
    },
  });
  return {
    id: created.id as string & tags.Format<"uuid">,
    memberuser_id: created.memberuser_id ?? undefined,
    guestuser_id: created.guestuser_id ?? undefined,
    charge_amount: created.charge_amount,
    charge_status: created.charge_status,
    payment_provider: created.payment_provider,
    payment_account: created.payment_account,
    paid_at: created.paid_at ? toISOStringSafe(created.paid_at) : null,
    created_at: toISOStringSafe(created.created_at),
    updated_at: toISOStringSafe(created.updated_at),
  };
}
