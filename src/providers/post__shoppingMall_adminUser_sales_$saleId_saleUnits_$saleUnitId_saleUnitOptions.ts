import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSaleUnitOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleUnitOption";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Creates a new sale unit option record under a specific sale unit, including
 * pricing adjustments and stock quantities.
 *
 * This operation requires an authenticated adminUser.
 *
 * @param props - Object containing the authenticated adminUser, saleId,
 *   saleUnitId, and the creation data for the sale unit option.
 * @returns The newly created sale unit option record.
 * @throws Will throw if the database operation fails.
 */
export async function post__shoppingMall_adminUser_sales_$saleId_saleUnits_$saleUnitId_saleUnitOptions(props: {
  adminUser: AdminuserPayload;
  saleId: string & tags.Format<"uuid">;
  saleUnitId: string & tags.Format<"uuid">;
  body: IShoppingMallSaleUnitOption.ICreate;
}): Promise<IShoppingMallSaleUnitOption> {
  const { adminUser, saleId, saleUnitId, body } = props;

  const created = await MyGlobal.prisma.shopping_mall_sale_unit_options.create({
    data: {
      id: v4() as string & tags.Format<"uuid">,
      shopping_mall_sale_unit_id: body.shopping_mall_sale_unit_id,
      shopping_mall_sale_option_id: body.shopping_mall_sale_option_id,
      additional_price: body.additional_price,
      stock_quantity: body.stock_quantity,
      created_at: toISOStringSafe(new Date()),
      updated_at: toISOStringSafe(new Date()),
      deleted_at: null,
    },
  });

  return {
    id: created.id,
    shopping_mall_sale_unit_id: created.shopping_mall_sale_unit_id,
    shopping_mall_sale_option_id: created.shopping_mall_sale_option_id,
    additional_price: created.additional_price,
    stock_quantity: created.stock_quantity,
    created_at: toISOStringSafe(created.created_at),
    updated_at: toISOStringSafe(created.updated_at),
    deleted_at: created.deleted_at ? toISOStringSafe(created.deleted_at) : null,
  };
}
