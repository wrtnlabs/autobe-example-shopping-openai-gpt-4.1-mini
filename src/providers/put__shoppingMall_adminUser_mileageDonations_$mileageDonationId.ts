import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallMileageDonation } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMileageDonation";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Update a mileage donation record
 *
 * Allows an authenticated admin user to update details of an existing mileage
 * donation. Updates the donation reason, amount, and donation date while
 * maintaining modification timestamps.
 *
 * @param props - Object containing adminUser payload, mileageDonationId path
 *   parameter, and body with update data
 * @param props.adminUser - Authenticated admin user making the request
 * @param props.mileageDonationId - UUID of the mileage donation record to
 *   update
 * @param props.body - Data to update the mileage donation record with
 * @returns Updated mileage donation record conforming to
 *   IShoppingMallMileageDonation
 * @throws {Error} If the record with the provided id does not exist
 */
export async function put__shoppingMall_adminUser_mileageDonations_$mileageDonationId(props: {
  adminUser: AdminuserPayload;
  mileageDonationId: string & tags.Format<"uuid">;
  body: IShoppingMallMileageDonation.IUpdate;
}): Promise<IShoppingMallMileageDonation> {
  const { adminUser, mileageDonationId, body } = props;

  // Check existence of the mileage donation record
  await MyGlobal.prisma.shopping_mall_mileage_donations.findUniqueOrThrow({
    where: { id: mileageDonationId },
  });

  // Perform update
  const updated = await MyGlobal.prisma.shopping_mall_mileage_donations.update({
    where: { id: mileageDonationId },
    data: {
      adminuser_id: body.adminuser_id ?? undefined,
      memberuser_id: body.memberuser_id ?? undefined,
      donation_reason: body.donation_reason ?? undefined,
      donation_amount: body.donation_amount ?? undefined,
      donation_date:
        body.donation_date !== undefined
          ? toISOStringSafe(body.donation_date)
          : undefined,
      updated_at: toISOStringSafe(new Date()),
    },
  });

  // Return updated record with date conversions
  return {
    id: updated.id,
    adminuser_id: updated.adminuser_id,
    memberuser_id: updated.memberuser_id,
    donation_reason: updated.donation_reason,
    donation_amount: updated.donation_amount,
    donation_date: toISOStringSafe(updated.donation_date),
    created_at: toISOStringSafe(updated.created_at),
    updated_at: toISOStringSafe(updated.updated_at),
  };
}
