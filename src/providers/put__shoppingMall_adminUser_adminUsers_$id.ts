import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Update an administrator user's information
 *
 * This operation updates email, nickname, full_name, and status fields for an
 * existing administrator user. Authorization requires an authenticated
 * adminUser.
 *
 * @param props - Object containing the authenticated adminUser, the id of the
 *   user to update, and the update data
 * @param props.adminUser - The authenticated administrator user performing the
 *   update
 * @param props.id - The UUID string of the administrator user to update
 * @param props.body - The update payload conforming to
 *   IShoppingMallAdminUser.IUpdate
 * @returns The updated administrator user object
 * @throws {Error} If the specified user does not exist
 */
export async function put__shoppingMall_adminUser_adminUsers_$id(props: {
  adminUser: AdminuserPayload;
  id: string & tags.Format<"uuid">;
  body: IShoppingMallAdminUser.IUpdate;
}): Promise<IShoppingMallAdminUser> {
  const { adminUser, id, body } = props;

  const existing =
    await MyGlobal.prisma.shopping_mall_adminusers.findUniqueOrThrow({
      where: { id },
    });

  const updated = await MyGlobal.prisma.shopping_mall_adminusers.update({
    where: { id },
    data: {
      email: body.email ?? undefined,
      nickname: body.nickname ?? undefined,
      full_name: body.full_name ?? undefined,
      status: body.status ?? undefined,
      updated_at: toISOStringSafe(new Date()),
    },
  });

  return {
    id: updated.id,
    email: updated.email,
    password_hash: updated.password_hash,
    nickname: updated.nickname,
    full_name: updated.full_name,
    status: updated.status,
    created_at: toISOStringSafe(updated.created_at),
    updated_at: toISOStringSafe(updated.updated_at),
    deleted_at: updated.deleted_at ? toISOStringSafe(updated.deleted_at) : null,
  };
}
