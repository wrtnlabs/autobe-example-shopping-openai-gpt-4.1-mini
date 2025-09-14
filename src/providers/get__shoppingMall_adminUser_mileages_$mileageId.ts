import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallMileage } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMileage";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Retrieves a specific mileage record for a customer by mileage ID.
 *
 * This operation is restricted to authorized admin users.
 *
 * @param props - Object containing the adminUser payload and mileageId path
 *   parameter.
 * @param props.adminUser - Authenticated admin user payload.
 * @param props.mileageId - UUID string identifying the mileage record to
 *   retrieve.
 * @returns Promise resolving to the detailed mileage record.
 * @throws {Error} Throws if the mileage record with given ID does not exist.
 */
export async function get__shoppingMall_adminUser_mileages_$mileageId(props: {
  adminUser: AdminuserPayload;
  mileageId: string & tags.Format<"uuid">;
}): Promise<IShoppingMallMileage> {
  const { mileageId } = props;

  const record = await MyGlobal.prisma.shopping_mall_mileages.findUnique({
    where: { id: mileageId },
  });

  if (!record) throw new Error("Mileage record not found");

  return {
    id: record.id,
    guestuser_id: record.guestuser_id ?? null,
    memberuser_id: record.memberuser_id ?? null,
    mileage_balance: record.mileage_balance,
    mileage_income: record.mileage_income,
    mileage_outcome: record.mileage_outcome,
    mileage_expired: record.mileage_expired,
    created_at: toISOStringSafe(record.created_at),
    updated_at: toISOStringSafe(record.updated_at),
  };
}
