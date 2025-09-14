import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallCoupon } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCoupon";
import { IPageIShoppingMallCoupon } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallCoupon";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

/**
 * Search and list discount coupons.
 *
 * This operation retrieves a paginated list of discount coupons available in
 * the shopping mall system. Supports searching, filtering, and sorting of
 * coupons by various criteria including code, name, status, and validity
 * periods.
 *
 * Coupons are stored in the shopping_mall_coupons table managing coupon
 * properties, usage limits, and channel restrictions.
 *
 * @param props - Object containing sellerUser authentication and search
 *   criteria in body
 * @param props.sellerUser - Authenticated sellerUser making the request
 * @param props.body - Search criteria and pagination parameters
 * @returns Paginated coupon summary list matching the filters
 * @throws {Error} Throws error if sellerUser is unauthenticated or query fails
 */
export async function patch__shoppingMall_sellerUser_coupons(props: {
  sellerUser: SelleruserPayload;
  body: IShoppingMallCoupon.IRequest;
}): Promise<IPageIShoppingMallCoupon.ISummary> {
  const { sellerUser, body } = props;

  const page = body.page ?? 1;
  const limit = body.limit ?? 10;
  const skip = (page - 1) * limit;

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
      body.status !== null && { status: body.status }),
    ...((body.start_date_from !== undefined && body.start_date_from !== null) ||
    (body.end_date_to !== undefined && body.end_date_to !== null)
      ? {
          start_date: {
            ...(body.start_date_from !== undefined &&
              body.start_date_from !== null && { gte: body.start_date_from }),
            ...(body.end_date_to !== undefined &&
              body.end_date_to !== null && { lte: body.end_date_to }),
          },
        }
      : {}),
  };

  const [results, total] = await Promise.all([
    MyGlobal.prisma.shopping_mall_coupons.findMany({
      where,
      orderBy:
        body.order_by === undefined || body.order_by === null
          ? { created_at: "desc" }
          : { [body.order_by]: "desc" },
      skip,
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
    data: results.map((r) => ({
      id: r.id,
      coupon_code: r.coupon_code,
      coupon_name: r.coupon_name,
      discount_type: r.discount_type,
      discount_value: r.discount_value,
      status: r.status,
      created_at: toISOStringSafe(r.created_at),
    })),
  };
}
