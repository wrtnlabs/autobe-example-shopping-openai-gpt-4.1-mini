import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Delete coupon condition record
 *
 * Permanently deletes the coupon condition identified by couponId and
 * conditionId from the system. This hard delete operation removes the condition
 * without affecting the coupon itself. Only accessible by an authenticated
 * adminUser.
 *
 * @param props - Object containing adminUser, couponId, and conditionId
 * @param props.adminUser - Authenticated admin user performing the deletion
 * @param props.couponId - UUID of the target coupon
 * @param props.conditionId - UUID of the coupon condition to delete
 * @throws {Error} When the specified coupon condition does not exist
 * @throws {Error} When the specified condition does not belong to the coupon
 */
export async function delete__shoppingMall_adminUser_coupons_$couponId_conditions_$conditionId(props: {
  adminUser: AdminuserPayload;
  couponId: string & tags.Format<"uuid">;
  conditionId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { adminUser, couponId, conditionId } = props;

  const condition =
    await MyGlobal.prisma.shopping_mall_coupon_conditions.findUnique({
      where: { id: conditionId },
    });

  if (!condition) {
    throw new Error("Coupon condition not found");
  }

  if (condition.shopping_mall_coupon_id !== couponId) {
    throw new Error("Condition does not belong to the specified coupon");
  }

  await MyGlobal.prisma.shopping_mall_coupon_conditions.delete({
    where: { id: conditionId },
  });
}
