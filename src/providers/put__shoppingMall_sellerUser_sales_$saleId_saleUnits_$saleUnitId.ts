import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSaleUnit } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleUnit";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

/**
 * Updates a sale unit belonging to a sale product.
 *
 * This operation checks the seller user authorization by verifying ownership of
 * the sale product before proceeding to update the sale unit identified by
 * saleUnitId under the specified saleId.
 *
 * The update covers modifiable fields like code, name, and description. The
 * updated_at timestamp is set to current time.
 *
 * @param props - The parameters including the authenticated seller user, sale
 *   product id, sale unit id, and the update data.
 * @returns The updated sale unit information with proper date-time string
 *   formats.
 * @throws {Error} When the sale product does not belong to the seller user or
 *   when the sale unit is not found.
 */
export async function put__shoppingMall_sellerUser_sales_$saleId_saleUnits_$saleUnitId(props: {
  sellerUser: SelleruserPayload;
  saleId: string & tags.Format<"uuid">;
  saleUnitId: string & tags.Format<"uuid">;
  body: IShoppingMallSaleUnit.IUpdate;
}): Promise<IShoppingMallSaleUnit> {
  const { sellerUser, saleId, saleUnitId, body } = props;

  // Verify the sale belongs to the sellerUser
  const sale = await MyGlobal.prisma.shopping_mall_sales.findFirst({
    where: {
      id: saleId,
      shopping_mall_seller_user_id: sellerUser.id,
      deleted_at: null,
    },
  });
  if (!sale) throw new Error("Sale product not found or unauthorized");

  // Find the sale unit
  const saleUnit = await MyGlobal.prisma.shopping_mall_sale_units.findFirst({
    where: {
      id: saleUnitId,
      shopping_mall_sale_id: saleId,
      deleted_at: null,
    },
  });
  if (!saleUnit) throw new Error("Sale unit not found");

  // Current date-time string for updated_at
  const now = toISOStringSafe(new Date());

  // Update the sale unit
  const updated = await MyGlobal.prisma.shopping_mall_sale_units.update({
    where: { id: saleUnitId },
    data: {
      shopping_mall_sale_id: body.shopping_mall_sale_id ?? undefined,
      code: body.code ?? undefined,
      name: body.name ?? undefined,
      description:
        body.description === null ? null : (body.description ?? undefined),
      updated_at: now,
    },
  });

  // Return updated sale unit with proper date-time formatting
  return {
    id: updated.id,
    shopping_mall_sale_id: updated.shopping_mall_sale_id,
    code: updated.code,
    name: updated.name,
    description: updated.description,
    created_at: toISOStringSafe(updated.created_at),
    updated_at: toISOStringSafe(updated.updated_at),
    deleted_at: updated.deleted_at ? toISOStringSafe(updated.deleted_at) : null,
  };
}
