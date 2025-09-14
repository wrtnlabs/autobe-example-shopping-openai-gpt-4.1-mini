import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallMileage } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMileage";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Create a new mileage record for a customer.
 *
 * This operation creates a mileage record linked to either a guest or member
 * user, initializing balance and mileage history values, with audit timestamps.
 * Only admins may perform this operation.
 *
 * @param props - Input properties
 * @param props.adminUser - The authenticated admin user performing this
 *   operation
 * @param props.body - The data to create a new mileage record
 * @returns The newly created IShoppingMallMileage record
 * @throws Error if creation fails (e.g., due to missing required fields or DB
 *   errors)
 */
export async function post__shoppingMall_adminUser_mileages(props: {
  adminUser: AdminuserPayload;
  body: IShoppingMallMileage.ICreate;
}): Promise<IShoppingMallMileage> {
  const id = v4() as string & tags.Format<"uuid">;
  const now = toISOStringSafe(new Date());

  const created = await MyGlobal.prisma.shopping_mall_mileages.create({
    data: {
      id: id,
      guestuser_id: props.body.guestuser_id ?? null,
      memberuser_id: props.body.memberuser_id ?? null,
      mileage_balance: props.body.mileage_balance,
      mileage_income: props.body.mileage_income,
      mileage_outcome: props.body.mileage_outcome,
      mileage_expired: props.body.mileage_expired,
      created_at: now,
      updated_at: now,
    },
  });

  return {
    id: created.id as string & tags.Format<"uuid">,
    guestuser_id: created.guestuser_id ?? null,
    memberuser_id: created.memberuser_id ?? null,
    mileage_balance: created.mileage_balance,
    mileage_income: created.mileage_income,
    mileage_outcome: created.mileage_outcome,
    mileage_expired: created.mileage_expired,
    created_at: toISOStringSafe(created.created_at),
    updated_at: toISOStringSafe(created.updated_at),
  };
}
