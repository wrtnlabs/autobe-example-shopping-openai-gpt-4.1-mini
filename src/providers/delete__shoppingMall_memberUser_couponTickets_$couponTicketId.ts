import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Delete coupon ticket permanently
 *
 * This operation permanently deletes a coupon ticket record from the
 * `shopping_mall_coupon_tickets` table identified by UUID. It performs a hard
 * delete removing all data associated with the coupon ticket.
 *
 * Access is restricted to authenticated users with the 'memberUser' role to
 * prevent unauthorized data loss.
 *
 * Deletion results in no response body, confirming complete removal of the
 * coupon ticket from the system.
 *
 * @param props - Object containing the authenticated memberUser and the
 *   couponTicketId to delete
 * @param props.memberUser - The authenticated memberUser performing the
 *   deletion
 * @param props.couponTicketId - UUID of the coupon ticket to be deleted
 * @throws {Error} When the coupon ticket does not exist
 * @throws {Error} When the coupon ticket is not owned by the authenticated
 *   memberUser
 */
export async function delete__shoppingMall_memberUser_couponTickets_$couponTicketId(props: {
  memberUser: MemberuserPayload;
  couponTicketId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { memberUser, couponTicketId } = props;

  // Fetch coupon ticket by id with only necessary fields
  const couponTicket =
    await MyGlobal.prisma.shopping_mall_coupon_tickets.findUnique({
      where: { id: couponTicketId },
      select: { id: true, memberuser_id: true },
    });

  if (!couponTicket) {
    throw new Error("Coupon ticket not found");
  }

  // Authorization check
  if (couponTicket.memberuser_id !== memberUser.id) {
    throw new Error(
      "Unauthorized: You can only delete your own coupon tickets",
    );
  }

  // Hard delete the coupon ticket
  await MyGlobal.prisma.shopping_mall_coupon_tickets.delete({
    where: { id: couponTicketId },
  });
}
