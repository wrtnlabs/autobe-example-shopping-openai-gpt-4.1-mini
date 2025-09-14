import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Delete a mileage donation record from the system by its unique identifier.
 *
 * This operation permanently removes the mileage donation entry representing
 * mileage points donated by administrators to members. The deleted record
 * cannot be recovered later.
 *
 * Access to this operation is restricted to authorized admin users with the
 * necessary permissions.
 *
 * @param props - Object containing adminUser and mileageDonationId for deletion
 *   context
 * @param props.adminUser - The authenticated admin user performing the deletion
 * @param props.mileageDonationId - Unique identifier of the mileage donation to
 *   delete
 * @returns Void
 * @throws {Error} When the mileage donation record does not exist
 */
export async function delete__shoppingMall_adminUser_mileageDonations_$mileageDonationId(props: {
  adminUser: AdminuserPayload;
  mileageDonationId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { adminUser, mileageDonationId } = props;

  // Ensure the mileage donation record exists
  await MyGlobal.prisma.shopping_mall_mileage_donations.findFirstOrThrow({
    where: { id: mileageDonationId },
  });

  // Perform hard delete of mileage donation
  await MyGlobal.prisma.shopping_mall_mileage_donations.delete({
    where: { id: mileageDonationId },
  });
}
