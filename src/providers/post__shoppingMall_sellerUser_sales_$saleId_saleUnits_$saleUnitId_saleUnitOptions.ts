import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSaleUnitOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleUnitOption";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

/**
 * Create a new sale unit option under a specific sale unit.
 *
 * This operation requires sellerUser authentication.
 *
 * @param props - Function input properties
 * @param props.sellerUser - Authenticated seller user payload
 * @param props.saleId - The unique identifier of the target sale product
 * @param props.saleUnitId - The unique identifier of the target sale unit
 * @param props.body - Data required to create the sale unit option
 * @returns The newly created sale unit option record
 * @throws {Error} When database operation fails or input is invalid
 */
export async function post__shoppingMall_sellerUser_sales_$saleId_saleUnits_$saleUnitId_saleUnitOptions(props: {
  sellerUser: SelleruserPayload;
  saleId: string & tags.Format<"uuid">;
  saleUnitId: string & tags.Format<"uuid">;
  body: IShoppingMallSaleUnitOption.ICreate;
}): Promise<IShoppingMallSaleUnitOption> {
  const { sellerUser, saleId, saleUnitId, body } = props;

  const now = toISOStringSafe(new Date());

  const created = await MyGlobal.prisma.shopping_mall_sale_unit_options.create({
    data: {
      id: v4() as string & tags.Format<"uuid">,
      shopping_mall_sale_unit_id: saleUnitId,
      shopping_mall_sale_option_id: body.shopping_mall_sale_option_id,
      additional_price: body.additional_price,
      stock_quantity: body.stock_quantity,
      created_at: now,
      updated_at: now,
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
