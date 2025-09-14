import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSaleOptionGroup } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleOptionGroup";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Get sale option group detail by ID
 *
 * This operation retrieves detailed information on a specific sale option group
 * by its unique identifier. Only authorized admin users can access the
 * details.
 *
 * @param props - Object containing adminUser and saleOptionGroupId
 * @param props.adminUser - The authenticated admin user payload
 * @param props.saleOptionGroupId - Unique UUID of the sale option group
 * @returns IShoppingMallSaleOptionGroup - Detailed sale option group
 *   information
 * @throws {Error} When the sale option group is not found
 */
export async function get__shoppingMall_adminUser_saleOptionGroups_$saleOptionGroupId(props: {
  adminUser: AdminuserPayload;
  saleOptionGroupId: string & tags.Format<"uuid">;
}): Promise<IShoppingMallSaleOptionGroup> {
  const { adminUser, saleOptionGroupId } = props;

  // Fetch the sale option group ensuring it's not soft deleted
  const record =
    await MyGlobal.prisma.shopping_mall_sale_option_groups.findFirst({
      where: { id: saleOptionGroupId, deleted_at: null },
    });

  if (!record) {
    throw new Error("Sale option group not found");
  }

  // Return DTO with all dates converted to ISO strings
  return {
    id: record.id,
    code: record.code,
    name: record.name,
    created_at: toISOStringSafe(record.created_at),
    updated_at: toISOStringSafe(record.updated_at),
    deleted_at: record.deleted_at ? toISOStringSafe(record.deleted_at) : null,
  };
}
