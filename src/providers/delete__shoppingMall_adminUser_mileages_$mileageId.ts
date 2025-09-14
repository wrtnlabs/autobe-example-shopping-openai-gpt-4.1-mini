import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Delete a mileage record permanently
 *
 * This operation permanently deletes a mileage record identified by mileageId
 * from the shopping mall backend database. It requires admin user
 * authorization.
 *
 * @param props - The request properties
 * @param props.adminUser - The authenticated admin user performing the
 *   operation
 * @param props.mileageId - The unique UUID of the mileage record to delete
 * @returns A promise that resolves with void when deletion is completed
 * @throws {Error} Throws if the mileage record does not exist
 */
export async function delete__shoppingMall_adminUser_mileages_$mileageId(props: {
  adminUser: AdminuserPayload;
  mileageId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { adminUser, mileageId } = props;

  // Confirm mileage record exists
  await MyGlobal.prisma.shopping_mall_mileages.findUniqueOrThrow({
    where: { id: mileageId },
  });

  // Hard delete the mileage record
  await MyGlobal.prisma.shopping_mall_mileages.delete({
    where: { id: mileageId },
  });
}
