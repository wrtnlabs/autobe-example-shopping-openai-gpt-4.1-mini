import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Get administrator user details by ID
 *
 * Retrieves detailed information of a specific administrator user by their
 * unique identifier. Access is strictly limited to authenticated users with
 * adminUser role.
 *
 * @param props - Object containing the authenticated adminUser and the target
 *   admin user ID
 * @param props.adminUser - Authenticated admin user making this request
 * @param props.id - UUID of the admin user to retrieve
 * @returns The detailed administrator user information
 * @throws {Error} When the administrator user is not found or inactive
 */
export async function get__shoppingMall_adminUser_adminUsers_$id(props: {
  adminUser: AdminuserPayload;
  id: string & tags.Format<"uuid">;
}): Promise<IShoppingMallAdminUser> {
  const found = await MyGlobal.prisma.shopping_mall_adminusers.findFirst({
    where: {
      id: props.id,
      deleted_at: null,
      status: "active",
    },
    select: {
      id: true,
      email: true,
      password_hash: true,
      nickname: true,
      full_name: true,
      status: true,
      created_at: true,
      updated_at: true,
      deleted_at: true,
    },
  });

  if (!found) throw new Error("Admin user not found or inactive");

  return {
    id: found.id,
    email: found.email,
    password_hash: found.password_hash,
    nickname: found.nickname,
    full_name: found.full_name,
    status: found.status,
    created_at: toISOStringSafe(found.created_at),
    updated_at: toISOStringSafe(found.updated_at),
    deleted_at: found.deleted_at ? toISOStringSafe(found.deleted_at) : null,
  };
}
