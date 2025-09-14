import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallCouponTicket } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCouponTicket";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Create a new coupon ticket record representing issuance of a coupon to a
 * customer.
 *
 * This operation is restricted to authenticated users with the 'memberUser'
 * role. It securely associates the ticket with the authenticated member user.
 *
 * @param props - Object containing authenticated member user and creation data
 * @param props.memberUser - Authenticated member user payload
 * @param props.body - Coupon ticket creation data conforming to
 *   IShoppingMallCouponTicket.ICreate
 * @returns The created coupon ticket record with all metadata
 * @throws {Error} When creation fails or unauthorized access occurs
 */
export async function post__shoppingMall_memberUser_couponTickets(props: {
  memberUser: MemberuserPayload;
  body: IShoppingMallCouponTicket.ICreate;
}): Promise<IShoppingMallCouponTicket> {
  const { memberUser, body } = props;

  const newId = v4() as string & tags.Format<"uuid">;
  const now = toISOStringSafe(new Date());

  const created = await MyGlobal.prisma.shopping_mall_coupon_tickets.create({
    data: {
      id: newId,
      shopping_mall_coupon_id: body.shopping_mall_coupon_id,
      guestuser_id: body.guestuser_id ?? null,
      memberuser_id: memberUser.id,
      selleruser_id: body.selleruser_id ?? null,
      adminuser_id: body.adminuser_id ?? null,
      ticket_code: body.ticket_code,
      valid_from: body.valid_from,
      valid_until: body.valid_until,
      usage_status: body.usage_status,
      used_at: body.used_at ?? null,
      created_at: now,
      updated_at: now,
    },
  });

  return {
    id: created.id as string & tags.Format<"uuid">,
    shopping_mall_coupon_id: created.shopping_mall_coupon_id as string &
      tags.Format<"uuid">,
    guestuser_id: created.guestuser_id ?? null,
    memberuser_id: created.memberuser_id as string & tags.Format<"uuid">,
    selleruser_id: created.selleruser_id ?? null,
    adminuser_id: created.adminuser_id ?? null,
    ticket_code: created.ticket_code,
    valid_from: toISOStringSafe(created.valid_from),
    valid_until: toISOStringSafe(created.valid_until),
    usage_status: created.usage_status,
    used_at: created.used_at ? toISOStringSafe(created.used_at) : null,
    created_at: toISOStringSafe(created.created_at),
    updated_at: toISOStringSafe(created.updated_at),
  };
}
