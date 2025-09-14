import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallCouponCondition } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCouponCondition";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Retrieve coupon condition details
 *
 * This function fetches detailed information for a specific coupon condition
 * identified by couponId and conditionId. This includes the condition type and
 * any scoped product, section, or category constraints.
 *
 * Access is restricted to authenticated admin users.
 *
 * @param props - Request properties
 * @param props.adminUser - The authenticated admin user making the request
 * @param props.couponId - UUID identifier of the target coupon
 * @param props.conditionId - UUID identifier of the coupon condition
 * @returns The coupon condition details
 * @throws {Error} If the coupon condition is not found
 */
export async function get__shoppingMall_adminUser_coupons_$couponId_conditions_$conditionId(props: {
  adminUser: AdminuserPayload;
  couponId: string & tags.Format<"uuid">;
  conditionId: string & tags.Format<"uuid">;
}): Promise<IShoppingMallCouponCondition> {
  const { adminUser, couponId, conditionId } = props;

  const record =
    await MyGlobal.prisma.shopping_mall_coupon_conditions.findFirstOrThrow({
      where: {
        id: conditionId,
        shopping_mall_coupon_id: couponId,
      },
    });

  return {
    id: record.id,
    shopping_mall_coupon_id: record.shopping_mall_coupon_id,
    condition_type: record.condition_type,
    product_id: record.product_id ?? null,
    section_id: record.section_id ?? null,
    category_id: record.category_id ?? null,
    created_at: toISOStringSafe(record.created_at),
    updated_at: toISOStringSafe(record.updated_at),
  };
}
