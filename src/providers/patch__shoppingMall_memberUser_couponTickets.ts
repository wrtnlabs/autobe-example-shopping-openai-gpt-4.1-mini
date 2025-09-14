import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallCouponTicket } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCouponTicket";
import { IPageIShoppingMallCouponTicket } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallCouponTicket";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

export async function patch__shoppingMall_memberUser_couponTickets(props: {
  memberUser: MemberuserPayload;
  body: IShoppingMallCouponTicket.IRequest;
}): Promise<IPageIShoppingMallCouponTicket.ISummary> {
  const { memberUser, body } = props;
  const page = body.page ?? 1;
  const limit = body.limit ?? 10;

  const where: any = {
    deleted_at: null,
    memberuser_id: memberUser.id,
    ...(body.shopping_mall_coupon_id !== undefined &&
      body.shopping_mall_coupon_id !== null && {
        shopping_mall_coupon_id: body.shopping_mall_coupon_id,
      }),
    ...(body.guestuser_id !== undefined &&
      body.guestuser_id !== null && { guestuser_id: body.guestuser_id }),
    // Removed body.memberuser_id filter for security enforcement
    ...(body.selleruser_id !== undefined &&
      body.selleruser_id !== null && { selleruser_id: body.selleruser_id }),
    ...(body.adminuser_id !== undefined &&
      body.adminuser_id !== null && { adminuser_id: body.adminuser_id }),
    ...(body.ticket_code !== undefined &&
      body.ticket_code !== null && {
        ticket_code: { contains: body.ticket_code },
      }),
    ...(body.usage_status !== undefined &&
      body.usage_status !== null && { usage_status: body.usage_status }),
    ...((body.valid_from_from !== undefined && body.valid_from_from !== null) ||
    (body.valid_from_to !== undefined && body.valid_from_to !== null)
      ? {
          valid_from: {
            ...(body.valid_from_from !== undefined &&
              body.valid_from_from !== null && { gte: body.valid_from_from }),
            ...(body.valid_from_to !== undefined &&
              body.valid_from_to !== null && { lte: body.valid_from_to }),
          },
        }
      : {}),
    ...((body.valid_until_from !== undefined &&
      body.valid_until_from !== null) ||
    (body.valid_until_to !== undefined && body.valid_until_to !== null)
      ? {
          valid_until: {
            ...(body.valid_until_from !== undefined &&
              body.valid_until_from !== null && { gte: body.valid_until_from }),
            ...(body.valid_until_to !== undefined &&
              body.valid_until_to !== null && { lte: body.valid_until_to }),
          },
        }
      : {}),
  };
  const skip = (page - 1) * limit;

  if (body.with_count) {
    const [rows, total] = await Promise.all([
      MyGlobal.prisma.shopping_mall_coupon_tickets.findMany({
        where,
        select: {
          id: true,
          shopping_mall_coupon_id: true,
          ticket_code: true,
          usage_status: true,
          created_at: true,
        },
        skip,
        take: limit,
        orderBy: { created_at: "desc" },
      }),
      MyGlobal.prisma.shopping_mall_coupon_tickets.count({ where }),
    ]);

    const data = rows.map((row) => ({
      id: row.id,
      shopping_mall_coupon_id: row.shopping_mall_coupon_id,
      ticket_code: row.ticket_code,
      usage_status: row.usage_status,
      created_at: toISOStringSafe(row.created_at),
    }));

    return {
      pagination: {
        current: Number(page),
        limit: Number(limit),
        records: total,
        pages: Math.ceil(total / limit),
      },
      data,
    };
  } else {
    const rows = await MyGlobal.prisma.shopping_mall_coupon_tickets.findMany({
      where,
      select: {
        id: true,
        shopping_mall_coupon_id: true,
        ticket_code: true,
        usage_status: true,
        created_at: true,
      },
      skip,
      take: limit,
      orderBy: { created_at: "desc" },
    });

    const data = rows.map((row) => ({
      id: row.id,
      shopping_mall_coupon_id: row.shopping_mall_coupon_id,
      ticket_code: row.ticket_code,
      usage_status: row.usage_status,
      created_at: toISOStringSafe(row.created_at),
    }));

    return {
      pagination: {
        current: Number(page),
        limit: Number(limit),
        records: 0,
        pages: 0,
      },
      data,
    };
  }
}
