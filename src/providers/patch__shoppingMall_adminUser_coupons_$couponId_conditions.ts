import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallCouponCondition } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCouponCondition";
import { IPageIShoppingMallCouponCondition } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallCouponCondition";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Search coupon conditions by couponId.
 *
 * This endpoint fetches paginated and filtered coupon conditions linked to a
 * specified couponId. Only accessible to users with the 'adminUser' role for
 * control over promotional configurations.
 *
 * @param props - Object containing the adminUser, couponId, and
 *   filter/pagination body.
 * @param props.adminUser - The authenticated adminUser performing the
 *   operation.
 * @param props.couponId - The UUID of the coupon to filter conditions.
 * @param props.body - Filtering and pagination parameters for coupon
 *   conditions.
 * @returns Paginated list of coupon condition summaries matching the criteria.
 * @throws {Error} If database query fails or invalid input is encountered.
 */
export async function patch__shoppingMall_adminUser_coupons_$couponId_conditions(props: {
  adminUser: AdminuserPayload;
  couponId: string & tags.Format<"uuid">;
  body: IShoppingMallCouponCondition.IRequest;
}): Promise<IPageIShoppingMallCouponCondition.ISummary> {
  const { adminUser, couponId, body } = props;

  const page = body.page ?? 1;
  const limit = body.limit ?? 20;

  const whereCondition = {
    shopping_mall_coupon_id: couponId,
    ...(body.condition_type !== undefined &&
      body.condition_type !== null && {
        condition_type: body.condition_type,
      }),
    ...(body.product_id !== undefined &&
      body.product_id !== null && {
        product_id: body.product_id,
      }),
    ...(body.section_id !== undefined &&
      body.section_id !== null && {
        section_id: body.section_id,
      }),
    ...(body.category_id !== undefined &&
      body.category_id !== null && {
        category_id: body.category_id,
      }),
    ...((body.created_at_from !== undefined && body.created_at_from !== null) ||
    (body.created_at_to !== undefined && body.created_at_to !== null)
      ? {
          created_at: {
            ...(body.created_at_from !== undefined &&
              body.created_at_from !== null && {
                gte: body.created_at_from,
              }),
            ...(body.created_at_to !== undefined &&
              body.created_at_to !== null && {
                lte: body.created_at_to,
              }),
          },
        }
      : {}),
    ...((body.updated_at_from !== undefined && body.updated_at_from !== null) ||
    (body.updated_at_to !== undefined && body.updated_at_to !== null)
      ? {
          updated_at: {
            ...(body.updated_at_from !== undefined &&
              body.updated_at_from !== null && {
                gte: body.updated_at_from,
              }),
            ...(body.updated_at_to !== undefined &&
              body.updated_at_to !== null && {
                lte: body.updated_at_to,
              }),
          },
        }
      : {}),
  };

  const [records, total] = await Promise.all([
    MyGlobal.prisma.shopping_mall_coupon_conditions.findMany({
      where: whereCondition,
      orderBy: { created_at: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    MyGlobal.prisma.shopping_mall_coupon_conditions.count({
      where: whereCondition,
    }),
  ]);

  return {
    pagination: {
      current: Number(page),
      limit: Number(limit),
      records: total,
      pages: Math.ceil(total / limit),
    },
    data: records.map((record) => ({
      id: record.id,
      shopping_mall_coupon_id: record.shopping_mall_coupon_id,
      condition_type: record.condition_type,
      created_at: toISOStringSafe(record.created_at),
      updated_at: toISOStringSafe(record.updated_at),
    })),
  };
}
