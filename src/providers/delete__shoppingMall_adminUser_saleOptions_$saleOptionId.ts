import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Deletes a sale option by its unique identifier.
 *
 * Permanently removes the sale option record from the database. This operation
 * requires an authenticated admin user.
 *
 * @param props - Object containing adminUser authentication and saleOptionId
 *   path parameter.
 * @param props.adminUser - The authenticated admin user requesting deletion.
 * @param props.saleOptionId - The UUID of the sale option to be deleted.
 * @returns A promise that resolves when deletion is complete.
 * @throws {Error} Throws if the sale option does not exist.
 */
export async function delete__shoppingMall_adminUser_saleOptions_$saleOptionId(props: {
  adminUser: AdminuserPayload;
  saleOptionId: string & tags.Format<"uuid">;
}): Promise<void> {
  await MyGlobal.prisma.shopping_mall_sale_options.delete({
    where: {
      id: props.saleOptionId,
    },
  });
}
