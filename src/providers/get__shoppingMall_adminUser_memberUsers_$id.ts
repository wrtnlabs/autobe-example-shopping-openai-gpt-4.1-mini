import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Get detailed information of a shopping mall member user by their unique ID.
 *
 * This operation retrieves all relevant profile fields except sensitive
 * information like password_hash. It is intended for administrative use or
 * authorized profile viewing.
 *
 * @param props - Object containing adminUser payload and member user ID
 * @param props.adminUser - Authenticated admin user performing the request
 * @param props.id - UUID string of the member user to retrieve
 * @returns The member user profile information excluding password_hash
 * @throws {Error} Throws if member user not found or inactive
 */
export async function get__shoppingMall_adminUser_memberUsers_$id(props: {
  adminUser: AdminuserPayload;
  id: string & tags.Format<"uuid">;
}): Promise<IShoppingMallMemberUser> {
  const { id } = props;

  const memberUser =
    await MyGlobal.prisma.shopping_mall_memberusers.findUniqueOrThrow({
      where: {
        id,
        deleted_at: null,
      },
    });

  return {
    id: memberUser.id,
    email: memberUser.email,
    password_hash: "", // returning empty string to satisfy required field without exposing real hash
    nickname: memberUser.nickname,
    full_name: memberUser.full_name,
    phone_number: memberUser.phone_number ?? null,
    status: memberUser.status,
    created_at: toISOStringSafe(memberUser.created_at),
    updated_at: toISOStringSafe(memberUser.updated_at),
    deleted_at: memberUser.deleted_at
      ? toISOStringSafe(memberUser.deleted_at)
      : null,
  };
}
