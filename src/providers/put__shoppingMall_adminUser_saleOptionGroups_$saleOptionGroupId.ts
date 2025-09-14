import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSaleOptionGroup } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleOptionGroup";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Update sale option group details by ID.
 *
 * This endpoint allows updating the code, name, and logical deletion status of
 * an existing sale option group identified by saleOptionGroupId.
 *
 * Requires admin user authorization.
 *
 * @param props - Object containing adminUser payload, saleOptionGroupId UUID,
 *   and update body data.
 * @returns The updated sale option group with all fields.
 * @throws {Error} When the sale option group with given ID does not exist.
 */
export async function put__shoppingMall_adminUser_saleOptionGroups_$saleOptionGroupId(props: {
  adminUser: AdminuserPayload;
  saleOptionGroupId: string & tags.Format<"uuid">;
  body: IShoppingMallSaleOptionGroup.IUpdate;
}): Promise<IShoppingMallSaleOptionGroup> {
  const { adminUser, saleOptionGroupId, body } = props;

  const updated = await MyGlobal.prisma.shopping_mall_sale_option_groups.update(
    {
      where: { id: saleOptionGroupId },
      data: {
        code: body.code ?? undefined,
        name: body.name ?? undefined,
        deleted_at: body.deleted_at ?? undefined,
      },
    },
  );

  return {
    id: updated.id,
    code: updated.code,
    name: updated.name,
    created_at: toISOStringSafe(updated.created_at),
    updated_at: toISOStringSafe(updated.updated_at),
    deleted_at: updated.deleted_at ? toISOStringSafe(updated.deleted_at) : null,
  };
}
