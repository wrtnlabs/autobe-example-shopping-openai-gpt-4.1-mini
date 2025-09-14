import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Deletes a shopping mall sale product by its unique identifier.
 *
 * This operation permanently removes the sale record identified by `saleId`
 * from the database. Cascade delete behavior defined in the Prisma schema
 * ensures removal of dependent records.
 *
 * Only users with the 'adminUser' role can perform this operation.
 *
 * @param props - Object containing the authenticated adminUser and the saleId
 *   to delete
 * @param props.adminUser - The authenticated admin user performing this
 *   deletion
 * @param props.saleId - The UUID of the sale product to be deleted
 * @throws {Error} Throws if the sale does not exist or if the user is
 *   unauthorized
 */
export async function delete__shoppingMall_adminUser_sales_$saleId(props: {
  adminUser: AdminuserPayload;
  saleId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { adminUser, saleId } = props;

  // Authorization is based on presence of adminUser

  // Verify that the sale product exists
  await MyGlobal.prisma.shopping_mall_sales.findUniqueOrThrow({
    where: { id: saleId },
  });

  // Perform hard delete
  await MyGlobal.prisma.shopping_mall_sales.delete({
    where: { id: saleId },
  });
}
