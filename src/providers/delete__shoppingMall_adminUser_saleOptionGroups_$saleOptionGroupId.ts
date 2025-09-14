import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Delete sale option group by ID
 *
 * This operation deletes a sale option group from the database permanently. It
 * requires adminUser authorization.
 *
 * @param props - Object containing adminUser and saleOptionGroupId path
 *   parameter
 * @param props.adminUser - Authenticated admin user payload
 * @param props.saleOptionGroupId - UUID of the sale option group to delete
 * @returns Void
 * @throws {Error} When no sale option group found with given ID (Prisma throws)
 */
export async function delete__shoppingMall_adminUser_saleOptionGroups_$saleOptionGroupId(props: {
  adminUser: AdminuserPayload;
  saleOptionGroupId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { adminUser, saleOptionGroupId } = props;

  // Hard delete since no deleted_at field exists
  await MyGlobal.prisma.shopping_mall_sale_option_groups.delete({
    where: {
      id: saleOptionGroupId,
    },
  });
}
