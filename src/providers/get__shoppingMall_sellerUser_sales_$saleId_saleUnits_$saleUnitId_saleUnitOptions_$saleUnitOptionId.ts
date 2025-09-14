import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSaleUnitOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleUnitOption";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

/**
 * Get detailed sale unit option information
 *
 * Retrieves detailed information for a specific sale unit option under a given
 * sale unit. Performs authorization by verifying the sellerUser owns the sale.
 *
 * @param props - Object containing sellerUser, saleId, saleUnitId, and
 *   saleUnitOptionId
 * @returns The detailed sale unit option data
 * @throws {Error} When sale or sale unit or sale unit option is not found or
 *   unauthorized
 */
export async function get__shoppingMall_sellerUser_sales_$saleId_saleUnits_$saleUnitId_saleUnitOptions_$saleUnitOptionId(props: {
  sellerUser: SelleruserPayload;
  saleId: string & tags.Format<"uuid">;
  saleUnitId: string & tags.Format<"uuid">;
  saleUnitOptionId: string & tags.Format<"uuid">;
}): Promise<IShoppingMallSaleUnitOption> {
  const { sellerUser, saleId, saleUnitId, saleUnitOptionId } = props;

  // Verify the sale exists and belongs to sellerUser and is not deleted
  const sale = await MyGlobal.prisma.shopping_mall_sales.findFirst({
    where: {
      id: saleId,
      shopping_mall_seller_user_id: sellerUser.id,
      deleted_at: null,
    },
  });
  if (!sale) throw new Error("Sale not found or unauthorized");

  // Verify sale unit exists, belongs to the sale and is not deleted
  const saleUnit = await MyGlobal.prisma.shopping_mall_sale_units.findFirst({
    where: {
      id: saleUnitId,
      shopping_mall_sale_id: saleId,
      deleted_at: null,
    },
  });
  if (!saleUnit) throw new Error("Sale unit not found or unauthorized");

  // Get the sale unit option, ensure it belongs to sale unit and not deleted
  const saleUnitOption =
    await MyGlobal.prisma.shopping_mall_sale_unit_options.findFirst({
      where: {
        id: saleUnitOptionId,
        shopping_mall_sale_unit_id: saleUnitId,
        deleted_at: null,
      },
    });
  if (!saleUnitOption) throw new Error("Sale unit option not found");

  // Return result with safe date-time string conversions
  return {
    id: saleUnitOption.id,
    shopping_mall_sale_unit_id: saleUnitOption.shopping_mall_sale_unit_id,
    shopping_mall_sale_option_id: saleUnitOption.shopping_mall_sale_option_id,
    additional_price: saleUnitOption.additional_price,
    stock_quantity: saleUnitOption.stock_quantity,
    created_at: toISOStringSafe(saleUnitOption.created_at),
    updated_at: toISOStringSafe(saleUnitOption.updated_at),
    deleted_at: saleUnitOption.deleted_at
      ? toISOStringSafe(saleUnitOption.deleted_at)
      : null,
  };
}
