import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Update an existing shopping mall seller user by ID
 *
 * This operation updates non-sensitive profile fields of the seller user,
 * allowing authorized admin users to modify details such as email, nickname,
 * full name, phone number, status, and business registration number without
 * exposing password management.
 *
 * @param props - Request properties
 * @param props.adminUser - Authenticated admin user performing the update
 * @param props.id - UUID of the seller user to update
 * @param props.body - The update data containing allowed fields
 * @returns The updated shopping mall seller user record
 * @throws {Error} Throws if the seller user with specified ID does not exist
 */
export async function put__shoppingMall_adminUser_sellerUsers_$id(props: {
  adminUser: AdminuserPayload;
  id: string & tags.Format<"uuid">;
  body: IShoppingMallSellerUser.IUpdate;
}): Promise<IShoppingMallSellerUser> {
  const { adminUser, id, body } = props;

  // Verify seller user exists
  await MyGlobal.prisma.shopping_mall_sellerusers.findUniqueOrThrow({
    where: { id },
  });

  // Update seller user
  const updated = await MyGlobal.prisma.shopping_mall_sellerusers.update({
    where: { id },
    data: {
      email: body.email ?? undefined,
      password_hash: body.password_hash ?? undefined,
      nickname: body.nickname ?? undefined,
      full_name: body.full_name ?? undefined,
      phone_number:
        body.phone_number === null ? null : (body.phone_number ?? undefined),
      status: body.status ?? undefined,
      business_registration_number:
        body.business_registration_number ?? undefined,
      updated_at: toISOStringSafe(new Date()),
    },
  });

  return {
    id: updated.id,
    email: updated.email,
    password_hash: updated.password_hash,
    nickname: updated.nickname,
    full_name: updated.full_name,
    phone_number: updated.phone_number ?? null,
    status: updated.status,
    business_registration_number: updated.business_registration_number,
    created_at: toISOStringSafe(updated.created_at),
    updated_at: toISOStringSafe(updated.updated_at),
    deleted_at: updated.deleted_at ? toISOStringSafe(updated.deleted_at) : null,
  };
}
