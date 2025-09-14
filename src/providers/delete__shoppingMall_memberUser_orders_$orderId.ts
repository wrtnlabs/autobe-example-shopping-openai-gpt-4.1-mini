import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Soft delete an order specified by orderId, marking it as deleted without
 * physical removal.
 *
 * Authorized roles include guestUser, memberUser, sellerUser, and adminUser.
 *
 * @param props - Object containing memberUser payload and orderId to delete
 * @param props.memberUser - Authenticated memberUser attempting to delete order
 * @param props.orderId - Unique identifier of the order to soft delete
 * @throws {Error} Throws if order is not found
 * @throws {Error} Throws if unauthorized (user does not own the order)
 */
export async function delete__shoppingMall_memberUser_orders_$orderId(props: {
  memberUser: MemberuserPayload;
  orderId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { memberUser, orderId } = props;

  const order = await MyGlobal.prisma.shopping_mall_orders.findUnique({
    where: { id: orderId },
  });

  if (!order) {
    throw new Error("Order not found");
  }

  if (order.shopping_mall_memberuser_id !== memberUser.id) {
    throw new Error("Unauthorized: You can only delete your own orders");
  }

  const now = toISOStringSafe(new Date());

  await MyGlobal.prisma.shopping_mall_orders.update({
    where: { id: orderId },
    data: { deleted_at: now },
  });
}
