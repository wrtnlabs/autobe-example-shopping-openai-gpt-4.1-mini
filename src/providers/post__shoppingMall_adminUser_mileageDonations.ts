import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallMileageDonation } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMileageDonation";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Create a new mileage donation record representing an admin's mileage award to
 * a member user.
 *
 * This endpoint requires authentication via adminUser. It inserts a new mileage
 * donation record with all required information.
 *
 * @param props - Object containing adminUser authentication and donation data
 * @param props.adminUser - Authenticated admin user performing the donation
 * @param props.body - Donation information including adminuser_id,
 *   memberuser_id, reason, amount, and date
 * @returns The created mileage donation record with identifiers and timestamps
 * @throws Error when database operation fails or required data is missing
 */
export async function post__shoppingMall_adminUser_mileageDonations(props: {
  adminUser: AdminuserPayload;
  body: IShoppingMallMileageDonation.ICreate;
}): Promise<IShoppingMallMileageDonation> {
  const id = v4();
  const now = toISOStringSafe(new Date());

  const created = await MyGlobal.prisma.shopping_mall_mileage_donations.create({
    data: {
      id: id,
      adminuser_id: props.body.adminuser_id,
      memberuser_id: props.body.memberuser_id,
      donation_reason: props.body.donation_reason,
      donation_amount: props.body.donation_amount,
      donation_date: toISOStringSafe(props.body.donation_date),
      created_at: now,
      updated_at: now,
    },
  });

  return {
    id: created.id,
    adminuser_id: created.adminuser_id,
    memberuser_id: created.memberuser_id,
    donation_reason: created.donation_reason,
    donation_amount: created.donation_amount,
    donation_date: created.donation_date
      ? toISOStringSafe(created.donation_date)
      : created.donation_date,
    created_at: toISOStringSafe(created.created_at),
    updated_at: toISOStringSafe(created.updated_at),
  };
}
