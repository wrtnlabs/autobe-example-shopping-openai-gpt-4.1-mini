import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSaleUnitOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleUnitOption";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

export async function put__shoppingMall_sellerUser_sales_$saleId_saleUnits_$saleUnitId_saleUnitOptions_$saleUnitOptionId(props: {
  sellerUser: SelleruserPayload;
  saleId: string & tags.Format<"uuid">;
  saleUnitId: string & tags.Format<"uuid">;
  saleUnitOptionId: string & tags.Format<"uuid">;
  body: IShoppingMallSaleUnitOption.IUpdate;
}): Promise<IShoppingMallSaleUnitOption> {
  const { sellerUser, saleId, saleUnitId, saleUnitOptionId, body } = props;

  const saleUnitOption =
    await MyGlobal.prisma.shopping_mall_sale_unit_options.findFirst({
      where: {
        id: saleUnitOptionId,
        shopping_mall_sale_unit_id: saleUnitId,
        deleted_at: null,
      },
    });

  if (!saleUnitOption) {
    throw new Error("Sale unit option not found or unauthorized");
  }

  // Verify that the sale unit option belongs to a sale under the sellerUser
  const saleUnit = await MyGlobal.prisma.shopping_mall_sale_units.findFirst({
    where: {
      id: saleUnitId,
      shopping_mall_sale_id: saleId,
    },
  });

  if (!saleUnit) {
    throw new Error("Sale unit not found or does not belong to given sale");
  }

  const sale = await MyGlobal.prisma.shopping_mall_sales.findFirst({
    where: {
      id: saleId,
      shopping_mall_seller_user_id: sellerUser.id,
      deleted_at: null,
    },
  });

  if (!sale) {
    throw new Error("Sale not found or unauthorized");
  }

  const updated = await MyGlobal.prisma.shopping_mall_sale_unit_options.update({
    where: { id: saleUnitOptionId },
    data: {
      shopping_mall_sale_unit_id: body.shopping_mall_sale_unit_id ?? undefined,
      shopping_mall_sale_option_id:
        body.shopping_mall_sale_option_id ?? undefined,
      additional_price: body.additional_price ?? undefined,
      stock_quantity: body.stock_quantity ?? undefined,
      updated_at: toISOStringSafe(new Date()),
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
