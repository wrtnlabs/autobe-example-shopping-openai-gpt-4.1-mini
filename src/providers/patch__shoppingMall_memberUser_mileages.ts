import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallMileage } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMileage";
import { IPageIShoppingMallMileage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallMileage";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Search and retrieve paginated mileage records.
 *
 * This operation allows authenticated member users to query their own mileage
 * point records. It supports filtering by mileage balance range, pagination,
 * and only returns records that belong to the authenticated member.
 *
 * @param props - The request object including memberUser payload and search
 *   filter body.
 * @param props.memberUser - Authenticated member user payload.
 * @param props.body - Search criteria and pagination parameters.
 * @returns A paginated list of mileage records matching the search filters.
 * @throws {Error} Throws if access is unauthorized or other internal errors
 *   occur.
 */
export async function patch__shoppingMall_memberUser_mileages(props: {
  memberUser: MemberuserPayload;
  body: IShoppingMallMileage.IRequest;
}): Promise<IPageIShoppingMallMileage> {
  const { memberUser, body } = props;

  const page = body.page ?? 1;
  const limit = body.limit ?? 10;

  // Enforce authorization by tying memberuser_id filter to authenticated user
  const where = {
    memberuser_id: memberUser.id,
    ...(body.guestuser_id !== undefined &&
      body.guestuser_id !== null && {
        guestuser_id: body.guestuser_id,
      }),
    ...(body.mileage_balance_min !== undefined &&
    body.mileage_balance_min !== null
      ? {
          mileage_balance: {
            gte: body.mileage_balance_min,
            ...(body.mileage_balance_max !== undefined &&
            body.mileage_balance_max !== null
              ? { lte: body.mileage_balance_max }
              : {}),
          },
        }
      : {}),
  };

  const [mileages, total] = await Promise.all([
    MyGlobal.prisma.shopping_mall_mileages.findMany({
      where,
      skip: (page - 1) * limit,
      take: limit,
    }),
    MyGlobal.prisma.shopping_mall_mileages.count({
      where,
    }),
  ]);

  return {
    pagination: {
      current: Number(page),
      limit: Number(limit),
      records: total,
      pages: Math.ceil(total / limit),
    },
    data: mileages.map((mileage) => ({
      id: mileage.id,
      guestuser_id: mileage.guestuser_id ?? null,
      memberuser_id: mileage.memberuser_id ?? null,
      mileage_balance: mileage.mileage_balance,
      mileage_income: mileage.mileage_income,
      mileage_outcome: mileage.mileage_outcome,
      mileage_expired: mileage.mileage_expired,
      created_at: toISOStringSafe(mileage.created_at),
      updated_at: toISOStringSafe(mileage.updated_at),
    })),
  };
}
