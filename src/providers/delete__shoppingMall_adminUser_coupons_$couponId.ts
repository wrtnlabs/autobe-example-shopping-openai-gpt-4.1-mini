import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Deletes a coupon permanently from the database based on its UUID.
 *
 * This operation requires an authenticated adminUser to perform the deletion.
 * It performs a hard delete, removing all traces of the coupon from the
 * system.
 *
 * @param props - Object containing the authenticated adminUser and the couponId
 *   to delete
 * @param props.adminUser - The authenticated adminUser performing the operation
 * @param props.couponId - UUID of the coupon to delete
 * @returns Void
 * @throws {Error} Throws if the coupon does not exist or deletion fails
 */
export async function delete__shoppingMall_adminUser_coupons_$couponId(props: {
  adminUser: AdminuserPayload;
  couponId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { adminUser, couponId } = props;

  await MyGlobal.prisma.shopping_mall_coupons.delete({
    where: { id: couponId },
  });
}
