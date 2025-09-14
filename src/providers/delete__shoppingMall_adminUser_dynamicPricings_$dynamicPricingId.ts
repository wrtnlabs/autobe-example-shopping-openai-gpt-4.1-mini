import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Permanently delete a specific dynamic pricing record by its unique
 * identifier.
 *
 * This operation irreversibly removes the entry from the database.
 *
 * Security is enforced by admin user role restriction to prevent unauthorized
 * deletion.
 *
 * @param props - Object containing the adminUser payload and the
 *   dynamicPricingId of the record to delete.
 * @param props.adminUser - The authenticated admin user performing the
 *   deletion.
 * @param props.dynamicPricingId - UUID string representing the dynamic pricing
 *   record to remove.
 * @returns Void
 * @throws {Error} Throws if the specified dynamic pricing record does not
 *   exist.
 */
export async function delete__shoppingMall_adminUser_dynamicPricings_$dynamicPricingId(props: {
  adminUser: AdminuserPayload;
  dynamicPricingId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { adminUser, dynamicPricingId } = props;

  await MyGlobal.prisma.shopping_mall_dynamic_pricing.delete({
    where: {
      id: dynamicPricingId,
    },
  });
}
