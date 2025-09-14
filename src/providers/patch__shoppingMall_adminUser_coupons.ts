import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallCoupon } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCoupon";
import { IPageIShoppingMallCoupon } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallCoupon";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Search and list discount coupons.
 *
 * This endpoint allows administrators, sellers, and members to access available
 * coupons subject to their permissions. Coupons support amount and percentage
 * discounts with conditions and expiration dates.
 *
 * @param props - Request properties containing the admin user and search
 *   criteria
 * @param props.adminUser - The authenticated admin user making the request
 * @param props.body - Request body containing coupon search filters and
 *   pagination
 * @returns A paginated summary list of coupons matching the criteria
 */
export async function patch__shoppingMall_adminUser_coupons(props: {
  adminUser: AdminuserPayload;
  body: IShoppingMallCoupon.IRequest;
}): Promise<IPageIShoppingMallCoupon.ISummary> {
  const { body } = props;

  const page = body.page ?? 1;
  const limit = body.limit ?? 10;

  const where = {
    deleted_at: null,
    ...(body.coupon_code !== undefined &&
      body.coupon_code !== null && {
        coupon_code: { contains: body.coupon_code },
      }),
    ...(body.coupon_name !== undefined &&
      body.coupon_name !== null && {
        coupon_name: { contains: body.coupon_name },
      }),
    ...(body.status !== undefined &&
      body.status !== null && {
        status: body.status,
      }),
    ...(() => {
      if (body.start_date_from !== undefined && body.start_date_from !== null) {
        return { start_date: { gte: body.start_date_from } };
      }
      return {};
    })(),
    ...(() => {
      if (body.end_date_to !== undefined && body.end_date_to !== null) {
        return { end_date: { lte: body.end_date_to } };
      }
      return {};
    })(),
  };

  const orderBy = body.order_by?.startsWith("-")
    ? { [body.order_by.slice(1)]: "desc" }
    : { [body.order_by?.replace("+", "") ?? "created_at"]: "asc" };

  const [records, total] = await Promise.all([
    MyGlobal.prisma.shopping_mall_coupons.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        coupon_code: true,
        coupon_name: true,
        discount_type: true,
        discount_value: true,
        status: true,
        created_at: true,
      },
    }),
    MyGlobal.prisma.shopping_mall_coupons.count({ where }),
  ]);

  return {
    pagination: {
      current: Number(page),
      limit: Number(limit),
      records: total,
      pages: Math.ceil(total / limit),
    },
    data: records.map((coupon) => ({
      id: coupon.id,
      coupon_code: coupon.coupon_code,
      coupon_name: coupon.coupon_name,
      discount_type: coupon.discount_type,
      discount_value: coupon.discount_value,
      status: coupon.status,
      created_at: toISOStringSafe(coupon.created_at),
    })),
  };
}
