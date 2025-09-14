import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallCouponTicket } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCouponTicket";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Retrieve detailed information of a single coupon ticket by its UUID.
 *
 * This function fetches the coupon ticket from the database, verifies that the
 * authenticated member user owns the ticket, and returns all relevant fields
 * including usage, validity dates, and timestamps.
 *
 * @param props - An object containing the authenticated member user and the
 *   coupon ticket ID
 * @param props.memberUser - The authenticated member user's payload
 * @param props.couponTicketId - The UUID of the coupon ticket to fetch
 * @returns The detailed coupon ticket matching the UUID owned by the member
 *   user
 * @throws {Error} When the coupon ticket does not exist or the member user is
 *   unauthorized
 */
export async function get__shoppingMall_memberUser_couponTickets_$couponTicketId(props: {
  memberUser: MemberuserPayload;
  couponTicketId: string & tags.Format<"uuid">;
}): Promise<IShoppingMallCouponTicket> {
  const { memberUser, couponTicketId } = props;

  const couponTicket =
    await MyGlobal.prisma.shopping_mall_coupon_tickets.findUniqueOrThrow({
      where: { id: couponTicketId },
    });

  if (couponTicket.memberuser_id !== memberUser.id) {
    throw new Error(
      "Unauthorized access: You can only access your own coupon tickets.",
    );
  }

  return {
    id: couponTicket.id,
    shopping_mall_coupon_id: couponTicket.shopping_mall_coupon_id,
    guestuser_id: couponTicket.guestuser_id ?? null,
    memberuser_id: couponTicket.memberuser_id ?? null,
    selleruser_id: couponTicket.selleruser_id ?? null,
    adminuser_id: couponTicket.adminuser_id ?? null,
    ticket_code: couponTicket.ticket_code,
    valid_from: toISOStringSafe(couponTicket.valid_from),
    valid_until: toISOStringSafe(couponTicket.valid_until),
    usage_status: couponTicket.usage_status,
    used_at: couponTicket.used_at
      ? toISOStringSafe(couponTicket.used_at)
      : null,
    created_at: toISOStringSafe(couponTicket.created_at),
    updated_at: toISOStringSafe(couponTicket.updated_at),
  };
}
