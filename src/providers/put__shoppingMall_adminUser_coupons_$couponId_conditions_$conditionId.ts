import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallCouponCondition } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCouponCondition";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Update coupon condition record
 *
 * Updates an existing coupon condition entry identified by couponId and
 * conditionId. Only fields provided in the body are updated. Throw error if
 * record not found. Updates the updated_at timestamp.
 *
 * @param props - Object containing adminUser, couponId, conditionId, and body
 * @param props.adminUser - Authenticated admin user payload
 * @param props.couponId - UUID of the coupon
 * @param props.conditionId - UUID of the coupon condition
 * @param props.body - Update payload for the coupon condition
 * @returns The updated coupon condition entity
 * @throws {Error} If the coupon condition does not exist
 */
export async function put__shoppingMall_adminUser_coupons_$couponId_conditions_$conditionId(props: {
  adminUser: AdminuserPayload;
  couponId: string & tags.Format<"uuid">;
  conditionId: string & tags.Format<"uuid">;
  body: IShoppingMallCouponCondition.IUpdate;
}): Promise<IShoppingMallCouponCondition> {
  const { adminUser, couponId, conditionId, body } = props;

  const condition =
    await MyGlobal.prisma.shopping_mall_coupon_conditions.findFirst({
      where: {
        id: conditionId,
        shopping_mall_coupon_id: couponId,
      },
    });

  if (!condition) {
    throw new Error("Coupon condition not found");
  }

  const updated = await MyGlobal.prisma.shopping_mall_coupon_conditions.update({
    where: { id: conditionId },
    data: {
      ...(body.shopping_mall_coupon_id !== undefined &&
        body.shopping_mall_coupon_id !== null && {
          shopping_mall_coupon_id: body.shopping_mall_coupon_id,
        }),
      ...(body.condition_type !== undefined &&
        body.condition_type !== null && {
          condition_type: body.condition_type,
        }),
      ...(body.product_id !== undefined && { product_id: body.product_id }),
      ...(body.section_id !== undefined && { section_id: body.section_id }),
      ...(body.category_id !== undefined && { category_id: body.category_id }),
      updated_at: toISOStringSafe(new Date()),
    },
  });

  return {
    id: updated.id,
    shopping_mall_coupon_id: updated.shopping_mall_coupon_id,
    condition_type: updated.condition_type,
    product_id: updated.product_id ?? null,
    section_id: updated.section_id ?? null,
    category_id: updated.category_id ?? null,
    created_at: toISOStringSafe(updated.created_at),
    updated_at: toISOStringSafe(updated.updated_at),
  };
}
