import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

/**
 * Deletes a shopping mall sale product by its unique ID.
 *
 * This function performs a hard delete on the shopping_mall_sales table,
 * permanently removing the sale record and all related entries via cascade.
 *
 * Authorization check ensures the sellerUser owns the sale product.
 *
 * @param props - The request properties containing authentication and
 *   parameters.
 * @param props.sellerUser - The authenticated seller user performing the
 *   deletion.
 * @param props.saleId - The UUID of the sale product to delete.
 * @returns Void
 * @throws {Error} Throws if the sale product does not exist.
 * @throws {Error} Throws if the seller user is not authorized to delete the
 *   sale.
 */
export async function delete__shoppingMall_sellerUser_sales_$saleId(props: {
  sellerUser: SelleruserPayload;
  saleId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { sellerUser, saleId } = props;

  const sale = await MyGlobal.prisma.shopping_mall_sales.findUnique({
    where: { id: saleId },
    select: { shopping_mall_seller_user_id: true },
  });

  if (!sale) throw new Error(`Sale with id ${saleId} not found.`);
  if (sale.shopping_mall_seller_user_id !== sellerUser.id) {
    throw new Error("Unauthorized: You can only delete your own sales.");
  }

  await MyGlobal.prisma.shopping_mall_sales.delete({ where: { id: saleId } });
}
