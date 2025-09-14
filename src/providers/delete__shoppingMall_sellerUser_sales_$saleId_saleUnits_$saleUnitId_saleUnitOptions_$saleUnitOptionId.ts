import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

/**
 * Permanently delete a sale unit option from a sale unit.
 *
 * This function deletes the record identified by saleUnitOptionId from the
 * shopping_mall_sale_unit_options table. This operation is irreversible and
 * requires the authenticated sellerUser.
 *
 * @param props - Object containing the authenticated sellerUser and identifiers
 *   of the sale, sale unit, and sale unit option to be deleted.
 * @param props.sellerUser - The authenticated seller user performing the
 *   deletion.
 * @param props.saleId - UUID of the sale product related to the sale unit
 *   option.
 * @param props.saleUnitId - UUID of the sale unit related to the sale unit
 *   option.
 * @param props.saleUnitOptionId - UUID of the sale unit option to delete.
 * @returns A Promise<void> indicating completion.
 * @throws {Error} Will throw if the sale unit option does not exist or deletion
 *   fails.
 */
export async function delete__shoppingMall_sellerUser_sales_$saleId_saleUnits_$saleUnitId_saleUnitOptions_$saleUnitOptionId(props: {
  sellerUser: SelleruserPayload;
  saleId: string & tags.Format<"uuid">;
  saleUnitId: string & tags.Format<"uuid">;
  saleUnitOptionId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { sellerUser, saleId, saleUnitId, saleUnitOptionId } = props;

  await MyGlobal.prisma.shopping_mall_sale_unit_options.delete({
    where: {
      id: saleUnitOptionId,
    },
  });
}
