import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallCouponTicket } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCouponTicket";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Update coupon ticket details
 *
 * This operation updates an existing coupon ticket in the
 * `shopping_mall_coupon_tickets` table, identified by its UUID. It allows
 * modification of coupon association, usage status, validity dates, and
 * ownership details.
 *
 * Access is restricted to authenticated users with the 'memberUser' role.
 * Authorization is enforced by verifying the coupon ticket ownership.
 *
 * @param props - Object containing memberUser payload, coupon ticket ID, and
 *   update body
 * @param props.memberUser - Authenticated member user performing the update
 * @param props.couponTicketId - UUID of the coupon ticket to update
 * @param props.body - Partial update data for the coupon ticket
 * @returns The updated coupon ticket record
 * @throws {Error} When the coupon ticket does not exist or when authorization
 *   fails
 */
export async function put__shoppingMall_memberUser_couponTickets_$couponTicketId(props: {
  memberUser: MemberuserPayload;
  couponTicketId: string & tags.Format<"uuid">;
  body: IShoppingMallCouponTicket.IUpdate;
}): Promise<IShoppingMallCouponTicket> {
  const { memberUser, couponTicketId, body } = props;

  const couponTicket =
    await MyGlobal.prisma.shopping_mall_coupon_tickets.findUniqueOrThrow({
      where: { id: couponTicketId },
    });

  if (couponTicket.memberuser_id !== memberUser.id) {
    throw new Error(
      "Unauthorized: Cannot update coupon ticket of another member user",
    );
  }

  const updated = await MyGlobal.prisma.shopping_mall_coupon_tickets.update({
    where: { id: couponTicketId },
    data: {
      shopping_mall_coupon_id: body.shopping_mall_coupon_id ?? undefined,
      guestuser_id: body.guestuser_id ?? undefined,
      memberuser_id: body.memberuser_id ?? undefined,
      selleruser_id: body.selleruser_id ?? undefined,
      adminuser_id: body.adminuser_id ?? undefined,
      ticket_code: body.ticket_code ?? undefined,
      valid_from: body.valid_from ?? undefined,
      valid_until: body.valid_until ?? undefined,
      usage_status: body.usage_status ?? undefined,
      used_at: body.used_at ?? undefined,
      created_at: body.created_at ?? undefined,
      updated_at: body.updated_at ?? undefined,
    },
  });

  return {
    id: updated.id,
    shopping_mall_coupon_id: updated.shopping_mall_coupon_id,
    guestuser_id: updated.guestuser_id,
    memberuser_id: updated.memberuser_id,
    selleruser_id: updated.selleruser_id,
    adminuser_id: updated.adminuser_id,
    ticket_code: updated.ticket_code,
    valid_from: toISOStringSafe(updated.valid_from),
    valid_until: toISOStringSafe(updated.valid_until),
    usage_status: updated.usage_status,
    used_at: updated.used_at ? toISOStringSafe(updated.used_at) : null,
    created_at: toISOStringSafe(updated.created_at),
    updated_at: toISOStringSafe(updated.updated_at),
  };
}
