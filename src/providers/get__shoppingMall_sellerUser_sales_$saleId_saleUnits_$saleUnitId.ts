import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSaleUnit } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleUnit";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

/**
 * Retrieves detailed information of a specific sale unit belonging to a
 * shopping mall sale product.
 *
 * This function ensures that the requesting sellerUser owns the sale product to
 * which the sale unit belongs, enforcing proper authorization.
 *
 * All timestamps are returned as ISO 8601 date-time strings with correct
 * branding.
 *
 * @param props - Object containing sellerUser payload, saleId, and saleUnitId
 * @param props.sellerUser - Authenticated seller user payload
 * @param props.saleId - Unique UUID of the sale product
 * @param props.saleUnitId - Unique UUID of the sale unit
 * @returns Detailed sale unit information conforming to IShoppingMallSaleUnit
 * @throws {Error} - Throws if the sale unit is not found or user is
 *   unauthorized
 */
export async function get__shoppingMall_sellerUser_sales_$saleId_saleUnits_$saleUnitId(props: {
  sellerUser: SelleruserPayload;
  saleId: string & tags.Format<"uuid">;
  saleUnitId: string & tags.Format<"uuid">;
}): Promise<IShoppingMallSaleUnit> {
  const { sellerUser, saleId, saleUnitId } = props;

  // Fetch the sale unit ensuring it belongs to the sale and is not deleted
  const saleUnit =
    await MyGlobal.prisma.shopping_mall_sale_units.findFirstOrThrow({
      where: {
        id: saleUnitId,
        shopping_mall_sale_id: saleId,
        deleted_at: null,
      },
    });

  // Fetch the sale to verify ownership
  const sale = await MyGlobal.prisma.shopping_mall_sales.findUniqueOrThrow({
    where: { id: saleId },
  });

  if (sale.shopping_mall_seller_user_id !== sellerUser.id) {
    throw new Error("Unauthorized");
  }

  // Return sale unit with all date-times converted
  return {
    id: saleUnit.id,
    shopping_mall_sale_id: saleUnit.shopping_mall_sale_id,
    code: saleUnit.code,
    name: saleUnit.name,
    description: saleUnit.description ?? null,
    created_at: toISOStringSafe(saleUnit.created_at),
    updated_at: toISOStringSafe(saleUnit.updated_at),
    deleted_at: saleUnit.deleted_at
      ? toISOStringSafe(saleUnit.deleted_at)
      : null,
  };
}
