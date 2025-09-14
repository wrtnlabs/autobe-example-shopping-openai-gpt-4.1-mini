import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallMileageDonation } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMileageDonation";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Get detailed mileage donation record information.
 *
 * This endpoint retrieves detailed information about a specific mileage
 * donation record identified by the 'mileageDonationId'. It includes the donor
 * admin user ID, recipient member user ID, donation reason, amount, and
 * timestamps for creation and last update.
 *
 * Only authenticated admin users are authorized to perform this operation.
 *
 * @param props - Object containing necessary parameters and authentication
 *   info.
 * @param props.adminUser - The authenticated admin user performing the request.
 * @param props.mileageDonationId - The UUID of the mileage donation record to
 *   retrieve.
 * @returns The mileage donation details as IShoppingMallMileageDonation.
 * @throws {Error} Throws if the mileage donation with given ID does not exist.
 */
export async function get__shoppingMall_adminUser_mileageDonations_$mileageDonationId(props: {
  adminUser: AdminuserPayload;
  mileageDonationId: string & tags.Format<"uuid">;
}): Promise<IShoppingMallMileageDonation> {
  const { mileageDonationId } = props;

  const donation =
    await MyGlobal.prisma.shopping_mall_mileage_donations.findUniqueOrThrow({
      where: { id: mileageDonationId },
    });

  return {
    id: donation.id,
    adminuser_id: donation.adminuser_id,
    memberuser_id: donation.memberuser_id,
    donation_reason: donation.donation_reason,
    donation_amount: donation.donation_amount,
    donation_date: toISOStringSafe(donation.donation_date),
    created_at: toISOStringSafe(donation.created_at),
    updated_at: toISOStringSafe(donation.updated_at),
  };
}
