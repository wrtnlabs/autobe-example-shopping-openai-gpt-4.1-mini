import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallDepositCharge } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallDepositCharge";
import { IPageIShoppingMallDepositCharge } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallDepositCharge";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Search deposit charge applications
 *
 * This operation retrieves a filtered and paginated list of deposit charge
 * applications within the shopping mall system based on various filtering
 * criteria.
 *
 * Only authorized member users can perform this operation.
 *
 * @param props - Object containing memberUser info and request body filters
 * @param props.memberUser - Authenticated member user payload
 * @param props.body - Filtering and pagination criteria
 * @returns A paginated list of deposit charge application records
 * @throws {Error} - Throws error on database failure or unexpected conditions
 */
export async function patch__shoppingMall_memberUser_depositCharges(props: {
  memberUser: MemberuserPayload;
  body: IShoppingMallDepositCharge.IRequest;
}): Promise<IPageIShoppingMallDepositCharge> {
  const { memberUser, body } = props;
  const page = body.page ?? 1;
  const limit = body.limit ?? 10;

  const where = {
    ...(body.guestuser_id !== undefined &&
      body.guestuser_id !== null && { guestuser_id: body.guestuser_id }),
    ...(body.memberuser_id !== undefined &&
      body.memberuser_id !== null && { memberuser_id: body.memberuser_id }),
    ...(body.charge_status !== undefined && {
      charge_status: body.charge_status,
    }),
    ...(body.payment_provider !== undefined && {
      payment_provider: body.payment_provider,
    }),
    ...(body.payment_account !== undefined && {
      payment_account: body.payment_account,
    }),
    ...(body.paid_at !== undefined &&
      body.paid_at !== null && { paid_at: body.paid_at }),
  };

  const [results, total] = await Promise.all([
    MyGlobal.prisma.shopping_mall_deposit_charges.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    MyGlobal.prisma.shopping_mall_deposit_charges.count({ where }),
  ]);

  return {
    pagination: {
      current: Number(page),
      limit: Number(limit),
      records: total,
      pages: Math.ceil(total / limit),
    },
    data: results.map((item) => ({
      id: item.id,
      guestuser_id: item.guestuser_id ?? undefined,
      memberuser_id: item.memberuser_id ?? undefined,
      charge_amount: item.charge_amount,
      charge_status: item.charge_status,
      payment_provider: item.payment_provider,
      payment_account: item.payment_account,
      paid_at: item.paid_at ? toISOStringSafe(item.paid_at) : null,
      created_at: toISOStringSafe(item.created_at),
      updated_at: toISOStringSafe(item.updated_at),
    })),
  };
}
