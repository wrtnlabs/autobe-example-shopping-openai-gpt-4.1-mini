import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSaleUnitOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleUnitOption";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Update a sale unit option.
 *
 * This operation updates an existing sale unit option identified by
 * saleUnitOptionId under the specified sale unit and sale product. Only
 * authorized adminUser may perform this operation.
 *
 * @param props - Object containing authentication, path parameters, and body.
 * @param props.adminUser - The authenticated admin user.
 * @param props.saleId - UUID of the sale product.
 * @param props.saleUnitId - UUID of the sale unit.
 * @param props.saleUnitOptionId - UUID of the sale unit option to update.
 * @param props.body - Update payload for sale unit option fields.
 * @returns The updated sale unit option object with all fields properly
 *   formatted.
 * @throws {Error} If the sale unit option does not exist.
 */
export async function put__shoppingMall_adminUser_sales_$saleId_saleUnits_$saleUnitId_saleUnitOptions_$saleUnitOptionId(props: {
  adminUser: AdminuserPayload;
  saleId: string & tags.Format<"uuid">;
  saleUnitId: string & tags.Format<"uuid">;
  saleUnitOptionId: string & tags.Format<"uuid">;
  body: IShoppingMallSaleUnitOption.IUpdate;
}): Promise<IShoppingMallSaleUnitOption> {
  const { adminUser, saleId, saleUnitId, saleUnitOptionId, body } = props;

  const existing =
    await MyGlobal.prisma.shopping_mall_sale_unit_options.findUnique({
      where: { id: saleUnitOptionId },
    });

  if (!existing) throw new Error("Sale unit option not found");

  const updated = await MyGlobal.prisma.shopping_mall_sale_unit_options.update({
    where: { id: saleUnitOptionId },
    data: {
      shopping_mall_sale_unit_id: body.shopping_mall_sale_unit_id ?? undefined,
      shopping_mall_sale_option_id:
        body.shopping_mall_sale_option_id ?? undefined,
      additional_price: body.additional_price ?? undefined,
      stock_quantity: body.stock_quantity ?? undefined,
    },
  });

  return {
    id: updated.id,
    shopping_mall_sale_unit_id: updated.shopping_mall_sale_unit_id,
    shopping_mall_sale_option_id: updated.shopping_mall_sale_option_id,
    additional_price: updated.additional_price,
    stock_quantity: updated.stock_quantity,
    created_at: toISOStringSafe(updated.created_at),
    updated_at: toISOStringSafe(updated.updated_at),
    deleted_at: updated.deleted_at ? toISOStringSafe(updated.deleted_at) : null,
  };
}
