import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSaleUnitOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleUnitOption";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Get detailed sale unit option information
 *
 * Retrieves a specific sale unit option by its unique identifier, scoped under
 * the specified sale and sale unit. Returns detailed option data including
 * additional pricing, stock quantity, and metadata.
 *
 * Requires adminUser authentication.
 *
 * @param props - Object containing adminUser payload, saleId, saleUnitId, and
 *   saleUnitOptionId
 * @returns The detailed sale unit option data
 * @throws {Error} If the sale unit option is not found or scoped incorrectly
 */
export async function get__shoppingMall_adminUser_sales_$saleId_saleUnits_$saleUnitId_saleUnitOptions_$saleUnitOptionId(props: {
  adminUser: AdminuserPayload;
  saleId: string & tags.Format<"uuid">;
  saleUnitId: string & tags.Format<"uuid">;
  saleUnitOptionId: string & tags.Format<"uuid">;
}): Promise<IShoppingMallSaleUnitOption> {
  const { adminUser, saleId, saleUnitId, saleUnitOptionId } = props;

  const saleUnitOption =
    await MyGlobal.prisma.shopping_mall_sale_unit_options.findFirst({
      where: {
        id: saleUnitOptionId,
        shopping_mall_sale_unit_id: saleUnitId,
        saleUnit: {
          shopping_mall_sale_id: saleId,
        },
        deleted_at: null,
      },
    });

  if (!saleUnitOption) {
    throw new Error(
      `Sale unit option with id ${saleUnitOptionId} not found or invalid scope.`,
    );
  }

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
