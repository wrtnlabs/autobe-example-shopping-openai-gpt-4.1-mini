import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Delete a sale unit option permanently
 *
 * This operation permanently deletes the sale unit option identified by
 * saleUnitOptionId from the sale unit under the specified sale product
 * (saleId).
 *
 * Only users with adminUser role are authorized to perform this operation.
 *
 * @param props - Object containing the authenticated adminUser and identifiers
 * @param props.adminUser - The admin user performing the deletion
 * @param props.saleId - Unique identifier of the sale product
 * @param props.saleUnitId - Unique identifier of the sale unit under the sale
 *   product
 * @param props.saleUnitOptionId - Unique identifier of the sale unit option to
 *   delete
 * @throws {Error} When the sale unit option does not exist or does not belong
 *   to the specified sale unit
 */
export async function delete__shoppingMall_adminUser_sales_$saleId_saleUnits_$saleUnitId_saleUnitOptions_$saleUnitOptionId(props: {
  adminUser: AdminuserPayload;
  saleId: string & tags.Format<"uuid">;
  saleUnitId: string & tags.Format<"uuid">;
  saleUnitOptionId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { adminUser, saleId, saleUnitId, saleUnitOptionId } = props;

  // Verify existence and ownership of the sale unit option
  const saleUnitOption =
    await MyGlobal.prisma.shopping_mall_sale_unit_options.findFirst({
      where: {
        id: saleUnitOptionId,
        shopping_mall_sale_unit_id: saleUnitId,
        deleted_at: null,
      },
    });

  if (!saleUnitOption) {
    throw new Error(
      `Sale unit option with id ${saleUnitOptionId} not found under sale unit ${saleUnitId}`,
    );
  }

  // Perform hard delete
  await MyGlobal.prisma.shopping_mall_sale_unit_options.delete({
    where: { id: saleUnitOptionId },
  });
}
