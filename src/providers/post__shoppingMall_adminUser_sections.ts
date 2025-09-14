import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSection } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSection";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Creates a new shopping mall spatial section.
 *
 * This endpoint allows an authenticated admin user to create a spatial section
 * in the shopping mall platform, which groups products and supports spatial
 * organization.
 *
 * The operation enforces that the section code is unique among active
 * (non-deleted) sections. Timestamps for creation and update are set
 * automatically.
 *
 * @param props - Object containing:
 *
 *   - AdminUser: Authenticated admin user payload
 *   - Body: The data required to create a spatial section
 *
 * @returns The newly created spatial section with all database fields
 * @throws {Error} When the provided section code already exists (duplicate)
 */
export async function post__shoppingMall_adminUser_sections(props: {
  adminUser: AdminuserPayload;
  body: IShoppingMallSection.ICreate;
}): Promise<IShoppingMallSection> {
  const { adminUser, body } = props;

  const existing = await MyGlobal.prisma.shopping_mall_sections.findFirst({
    where: { code: body.code, deleted_at: null },
  });

  if (existing) {
    throw new Error("Duplicate code");
  }

  const now = toISOStringSafe(new Date());

  const created = await MyGlobal.prisma.shopping_mall_sections.create({
    data: {
      id: v4(),
      code: body.code,
      name: body.name,
      description: body.description ?? null,
      status: body.status,
      created_at: now,
      updated_at: now,
    },
  });

  return {
    id: created.id,
    code: created.code,
    name: created.name,
    description: created.description,
    status: created.status,
    created_at: toISOStringSafe(created.created_at),
    updated_at: toISOStringSafe(created.updated_at),
    deleted_at: created.deleted_at ? toISOStringSafe(created.deleted_at) : null,
  };
}
