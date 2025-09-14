import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallCategory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCategory";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Create a new product category.
 *
 * This operation requires an authenticated admin user. It creates a new entry
 * in the shopping_mall_categories table with specified code, name, status, and
 * optional description. It sets creation and update timestamps.
 *
 * @param props - The function props containing adminUser and creation data.
 * @param props.adminUser - The authenticated admin user payload.
 * @param props.body - The category creation data.
 * @returns The newly created shopping mall category.
 * @throws {Error} Throws if creation fails, e.g., due to duplicate code.
 */
export async function post__shoppingMall_adminUser_categories(props: {
  adminUser: AdminuserPayload;
  body: IShoppingMallCategory.ICreate;
}): Promise<IShoppingMallCategory> {
  const { adminUser, body } = props;

  const id = v4() as string & tags.Format<"uuid">;
  const now = toISOStringSafe(new Date());

  const created = await MyGlobal.prisma.shopping_mall_categories.create({
    data: {
      id,
      code: body.code,
      name: body.name,
      status: body.status,
      description: body.description ?? null,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    },
  });

  return {
    id: created.id,
    code: created.code,
    name: created.name,
    status: created.status,
    description: created.description ?? null,
    created_at: toISOStringSafe(created.created_at),
    updated_at: toISOStringSafe(created.updated_at),
    deleted_at: created.deleted_at ? toISOStringSafe(created.deleted_at) : null,
  };
}
