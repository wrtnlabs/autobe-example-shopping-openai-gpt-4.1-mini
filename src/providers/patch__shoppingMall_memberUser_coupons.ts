import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallCoupon } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCoupon";
import { IPageIShoppingMallCoupon } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallCoupon";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

export async function patch__shoppingMall_memberUser_coupons(props: {
  memberUser: MemberuserPayload;
  body: IShoppingMallCoupon.IRequest;
}): Promise<IPageIShoppingMallCoupon.ISummary> {
  const { memberUser, body } = props;

  const member = await MyGlobal.prisma.shopping_mall_memberusers.findFirst({
    where: {
      id: memberUser.id,
      deleted_at: null,
      status: "active",
    },
  });

  if (!member)
    throw new Error("Unauthorized: Member user is not active or not found");

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
          AND: [
            ...(body.start_date_from !== undefined &&
            body.start_date_from !== null
              ? [{ start_date: { gte: body.start_date_from } }]
              : []),
            ...(body.end_date_to !== undefined && body.end_date_to !== null
              ? [{ end_date: { lte: body.end_date_to } }]
              : []),
          ],
        }
      : {}),
  };

  const page = body.page && body.page > 0 ? body.page : 1;
  const limit = body.limit && body.limit > 0 ? body.limit : 10;
  const skip = (page - 1) * limit;

  const couponsCount = await MyGlobal.prisma.shopping_mall_coupons.count({
    where,
  });

  const coupons = await MyGlobal.prisma.shopping_mall_coupons.findMany({
    where,
    orderBy:
      body.order_by && typeof body.order_by === "string"
        ? { [body.order_by]: "asc" as const }
        : { created_at: "desc" as const },
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
  });

  return {
    pagination: {
      current: Number(page),
      limit: Number(limit),
      records: couponsCount,
      pages: Math.ceil(couponsCount / limit),
    },
    data: coupons.map((c) => ({
      id: c.id,
      coupon_code: c.coupon_code,
      coupon_name: c.coupon_name,
      discount_type: c.discount_type,
      discount_value: c.discount_value,
      status: c.status,
      created_at: toISOStringSafe(c.created_at),
    })),
  };
}
