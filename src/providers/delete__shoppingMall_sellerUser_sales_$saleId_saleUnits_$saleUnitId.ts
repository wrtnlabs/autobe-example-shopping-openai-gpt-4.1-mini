import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

/**
 * Deletes a sale unit from a shopping mall sale product.
 *
 * This operation permanently removes the sale unit identified by `saleUnitId`
 * from the specified sale product `saleId`. It enforces authorization to ensure
 * that only the owner seller user can perform this deletion.
 *
 * The deletion is irreversible and removes the sale unit record entirely.
 *
 * @param props - Object containing sellerUser and identification parameters
 * @param props.sellerUser - The authenticated seller user performing the
 *   deletion
 * @param props.saleId - UUID of the sale product
 * @param props.saleUnitId - UUID of the sale unit to delete
 * @throws {Error} If the seller user does not own the sale product
 * @throws {Error} If the sale unit does not belong to the specified sale
 * @throws {Error} If the sale product or sale unit cannot be found
 */
export async function delete__shoppingMall_sellerUser_sales_$saleId_saleUnits_$saleUnitId(props: {
  sellerUser: SelleruserPayload;
  saleId: string & tags.Format<"uuid">;
  saleUnitId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { sellerUser, saleId, saleUnitId } = props;

  // Fetch the sale and check ownership
  const sale = await MyGlobal.prisma.shopping_mall_sales.findUniqueOrThrow({
    where: { id: saleId },
  });

  if (sale.shopping_mall_seller_user_id !== sellerUser.id) {
    throw new Error("Unauthorized: You do not own this sale product");
  }

  // Fetch the sale unit and verify association
  const saleUnit =
    await MyGlobal.prisma.shopping_mall_sale_units.findUniqueOrThrow({
      where: { id: saleUnitId },
    });

  if (saleUnit.shopping_mall_sale_id !== saleId) {
    throw new Error("Sale unit does not belong to the specified sale product");
  }

  // Perform hard delete of the sale unit
  await MyGlobal.prisma.shopping_mall_sale_units.delete({
    where: { id: saleUnitId },
  });
}
