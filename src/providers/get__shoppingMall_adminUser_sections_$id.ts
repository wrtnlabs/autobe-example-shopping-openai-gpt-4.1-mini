import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSection } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSection";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Retrieve a specific shopping mall section by its unique ID.
 *
 * This operation returns all stored fields including code, name, description,
 * status, timestamps, and soft deletion indicator. Only accessible by
 * authorized admin users.
 *
 * @param props - Properties including authenticated adminUser and section ID
 * @param props.adminUser - Authenticated admin user payload
 * @param props.id - Unique identifier (UUID) for the shopping mall section
 * @returns The detailed shopping mall section information
 * @throws {Error} Throws if the section is not found
 */
export async function get__shoppingMall_adminUser_sections_$id(props: {
  adminUser: AdminuserPayload;
  id: string & tags.Format<"uuid">;
}): Promise<IShoppingMallSection> {
  const { adminUser, id } = props;
  const section =
    await MyGlobal.prisma.shopping_mall_sections.findUniqueOrThrow({
      where: { id },
    });
  return {
    id: section.id,
    code: section.code,
    name: section.name,
    description: section.description ?? null,
    status: section.status,
    created_at: toISOStringSafe(section.created_at),
    updated_at: toISOStringSafe(section.updated_at),
    deleted_at: section.deleted_at ? toISOStringSafe(section.deleted_at) : null,
  };
}
