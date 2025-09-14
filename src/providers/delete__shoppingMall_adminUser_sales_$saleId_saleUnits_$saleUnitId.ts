import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Deletes a specific sale unit associated with a shopping mall sale product.
 *
 * This operation permanently removes the sale unit record and its related sale
 * unit options from the database.
 *
 * Authorization is enforced through the presence of an authenticated adminUser.
 *
 * @param props - An object containing the authenticated adminUser and
 *   identifiers for the sale and sale unit to delete.
 * @param props.adminUser - Authenticated admin user performing the operation.
 * @param props.saleId - Unique identifier of the sale product.
 * @param props.saleUnitId - Unique identifier of the sale unit to delete.
 * @throws {Error} Throws an error if the sale unit doesn't exist or doesn't
 *   belong to the sale.
 */
export async function delete__shoppingMall_adminUser_sales_$saleId_saleUnits_$saleUnitId(props: {
  adminUser: AdminuserPayload;
  saleId: string & tags.Format<"uuid">;
  saleUnitId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { adminUser, saleId, saleUnitId } = props;

  const saleUnit = await MyGlobal.prisma.shopping_mall_sale_units.findUnique({
    where: { id: saleUnitId },
    select: { id: true, shopping_mall_sale_id: true },
  });

  if (!saleUnit || saleUnit.shopping_mall_sale_id !== saleId) {
    throw new Error("Sale unit not found or does not belong to the sale");
  }

  await MyGlobal.prisma.shopping_mall_sale_unit_options.deleteMany({
    where: { shopping_mall_sale_unit_id: saleUnitId },
  });

  await MyGlobal.prisma.shopping_mall_sale_units.delete({
    where: { id: saleUnitId },
  });
}
