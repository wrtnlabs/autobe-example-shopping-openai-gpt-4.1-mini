import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallMileage } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMileage";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Update an existing mileage record.
 *
 * This operation updates the mileage record identified by `mileageId` with new
 * values provided in the `body`. It ensures that only provided fields are
 * updated, and timestamps the update operation with the current datetime in ISO
 * format.
 *
 * Authorization is required with an admin user payload.
 *
 * @param props - Object containing adminUser payload, mileageId, and update
 *   body
 * @param props.adminUser - Authenticated admin user making the request
 * @param props.mileageId - UUID of the mileage record to update
 * @param props.body - Partial mileage data to update
 * @returns The updated mileage record with all date properties converted to ISO
 *   strings
 * @throws {Error} If the mileage record does not exist
 */
export async function put__shoppingMall_adminUser_mileages_$mileageId(props: {
  adminUser: AdminuserPayload;
  mileageId: string & tags.Format<"uuid">;
  body: IShoppingMallMileage.IUpdate;
}): Promise<IShoppingMallMileage> {
  const { adminUser, mileageId, body } = props;

  const existing =
    await MyGlobal.prisma.shopping_mall_mileages.findUniqueOrThrow({
      where: { id: mileageId },
    });

  const updated = await MyGlobal.prisma.shopping_mall_mileages.update({
    where: { id: mileageId },
    data: {
      guestuser_id: body.guestuser_id ?? undefined,
      memberuser_id: body.memberuser_id ?? undefined,
      mileage_balance: body.mileage_balance ?? undefined,
      mileage_income: body.mileage_income ?? undefined,
      mileage_outcome: body.mileage_outcome ?? undefined,
      mileage_expired: body.mileage_expired ?? undefined,
      updated_at: toISOStringSafe(new Date()),
    },
  });

  return {
    id: updated.id,
    guestuser_id: updated.guestuser_id ?? null,
    memberuser_id: updated.memberuser_id ?? null,
    mileage_balance: updated.mileage_balance,
    mileage_income: updated.mileage_income,
    mileage_outcome: updated.mileage_outcome,
    mileage_expired: updated.mileage_expired,
    created_at: toISOStringSafe(updated.created_at),
    updated_at: toISOStringSafe(updated.updated_at),
  };
}
