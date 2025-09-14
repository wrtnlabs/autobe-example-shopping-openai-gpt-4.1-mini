import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSection } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSection";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Update a specific product section by ID
 *
 * This endpoint updates detailed information of a section entity identified by
 * its UUID. It allows modification of the section's code, name, description,
 * and status. The update respects business rules regarding section lifecycle
 * and data consistency.
 *
 * Authorization for admin users is required to perform this operation.
 *
 * @param props - Object containing authorization, path parameter, and body for
 *   update
 * @param props.adminUser - Authenticated admin user performing the update
 * @param props.id - Unique identifier (UUID) of the target section to update
 * @param props.body - Update payload containing optional fields: code, name,
 *   description, status
 * @returns The updated section entity with all fields reflecting current data
 * @throws {Error} Throws if the section with given ID does not exist or update
 *   fails
 */
export async function put__shoppingMall_adminUser_sections_$id(props: {
  adminUser: AdminuserPayload;
  id: string & tags.Format<"uuid">;
  body: IShoppingMallSection.IUpdate;
}): Promise<IShoppingMallSection> {
  const { adminUser, id, body } = props;

  const now = toISOStringSafe(new Date());

  const updated = await MyGlobal.prisma.shopping_mall_sections.update({
    where: { id },
    data: {
      ...(body.code !== undefined && { code: body.code }),
      ...(body.name !== undefined && { name: body.name }),
      ...(body.description !== undefined && { description: body.description }),
      ...(body.status !== undefined && { status: body.status }),
      updated_at: now,
    },
  });

  return {
    id: updated.id,
    code: updated.code,
    name: updated.name,
    description: updated.description ?? null,
    status: updated.status,
    created_at: toISOStringSafe(updated.created_at),
    updated_at: toISOStringSafe(updated.updated_at),
    deleted_at: updated.deleted_at ? toISOStringSafe(updated.deleted_at) : null,
  };
}
