import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Update an existing shopping mall member user by ID
 *
 * This operation updates editable profile fields of a member user record
 * identified by the given UUID. It allows modification of email, password_hash,
 * nickname, full_name, phone number, status, and audit timestamps.
 *
 * @param props.adminUser - The authenticated admin user performing the update
 *   (authorization guaranteed externally).
 * @param props.id - UUID of the member user to update
 * @param props.body - Update payload conforming to
 *   IShoppingMallMemberUser.IUpdate
 * @returns The updated member user record
 * @throws {Error} When the member user identified by ID does not exist
 */
export async function put__shoppingMall_adminUser_memberUsers_$id(props: {
  adminUser: AdminuserPayload;
  id: string & tags.Format<"uuid">;
  body: IShoppingMallMemberUser.IUpdate;
}): Promise<IShoppingMallMemberUser> {
  const { adminUser, id, body } = props;

  const existing = await MyGlobal.prisma.shopping_mall_memberusers.findUnique({
    where: { id },
  });

  if (!existing) throw new Error(`Member user with id ${id} not found`);

  const updated = await MyGlobal.prisma.shopping_mall_memberusers.update({
    where: { id },
    data: {
      email: body.email ?? undefined,
      password_hash: body.password_hash ?? undefined,
      nickname: body.nickname ?? undefined,
      full_name: body.full_name ?? undefined,
      phone_number: body.phone_number ?? undefined,
      status: body.status ?? undefined,
      created_at: body.created_at ?? undefined,
      updated_at: body.updated_at ?? undefined,
      deleted_at: body.deleted_at ?? undefined,
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
    created_at: toISOStringSafe(updated.created_at),
    updated_at: toISOStringSafe(updated.updated_at),
    deleted_at: updated.deleted_at ? toISOStringSafe(updated.deleted_at) : null,
  };
}
