import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallMileageDonation } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMileageDonation";
import { IPageIShoppingMallMileageDonation } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallMileageDonation";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Search and list mileage donations with filtering and pagination.
 *
 * Retrieves a paginated list of mileage donation records filtered by admin user
 * ID, member user ID, donation reason, donation amount range, and donation date
 * range. Supports sorting by donation date or donation amount and pagination
 * controls. Requires adminUser authorization.
 *
 * @param props - Object containing adminUser credentials and filter parameters
 * @param props.adminUser - Authenticated admin user payload
 * @param props.body - Request body with filtering, sorting, and paging
 *   parameters
 * @returns Paginated list of mileage donations matching criteria
 * @throws {Error} If database querying fails or parameters are invalid
 */
export async function patch__shoppingMall_adminUser_mileageDonations(props: {
  adminUser: AdminuserPayload;
  body: IShoppingMallMileageDonation.IRequest;
}): Promise<IPageIShoppingMallMileageDonation> {
  const { adminUser, body } = props;

  const page = body.page ?? 1;
  const limit = body.limit ?? 100;

  const where = {
    ...(body.adminuser_id !== undefined &&
      body.adminuser_id !== null && {
        adminuser_id: body.adminuser_id,
      }),
    ...(body.memberuser_id !== undefined &&
      body.memberuser_id !== null && {
        memberuser_id: body.memberuser_id,
      }),
    ...(body.donation_reason !== undefined &&
      body.donation_reason !== null && {
        donation_reason: { contains: body.donation_reason },
      }),
    ...(body.min_donation_amount !== undefined &&
      body.min_donation_amount !== null && {
        donation_amount: { gte: body.min_donation_amount },
      }),
    ...(body.max_donation_amount !== undefined &&
      body.max_donation_amount !== null && {
        donation_amount: { lte: body.max_donation_amount },
      }),
    ...((body.donation_date_start !== undefined &&
      body.donation_date_start !== null) ||
    (body.donation_date_end !== undefined && body.donation_date_end !== null)
      ? {
          donation_date: {
            ...(body.donation_date_start !== undefined &&
              body.donation_date_start !== null && {
                gte: body.donation_date_start,
              }),
            ...(body.donation_date_end !== undefined &&
              body.donation_date_end !== null && {
                lte: body.donation_date_end,
              }),
          },
        }
      : {}),
  };

  const orderByField =
    body.sort_by === "donation_date" || body.sort_by === "donation_amount"
      ? body.sort_by
      : "created_at";

  const orderByDirection =
    body.sort_direction === "asc" || body.sort_direction === "desc"
      ? body.sort_direction
      : "desc";

  const [results, total] = await Promise.all([
    MyGlobal.prisma.shopping_mall_mileage_donations.findMany({
      where,
      orderBy: { [orderByField]: orderByDirection },
      skip: (page - 1) * limit,
      take: limit,
    }),
    MyGlobal.prisma.shopping_mall_mileage_donations.count({ where }),
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
      adminuser_id: item.adminuser_id,
      memberuser_id: item.memberuser_id,
      donation_reason: item.donation_reason,
      donation_amount: item.donation_amount,
      donation_date: toISOStringSafe(item.donation_date),
      created_at: toISOStringSafe(item.created_at),
      updated_at: toISOStringSafe(item.updated_at),
    })),
  };
}
