import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSaleUnit } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleUnit";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Update a sale unit of a sale product.
 *
 * This operation updates an existing sale unit identified by saleUnitId
 * belonging to a shopping mall sale product saleId. Sale units represent
 * sub-components of products with modifiable code, name, and description
 * fields.
 *
 * Only admin users can perform this update.
 *
 * @param props - Object containing adminUser payload, saleId, saleUnitId, and
 *   update body
 * @returns The updated sale unit information
 * @throws {Error} When the sale unit does not exist or update fails
 */
export async function put__shoppingMall_adminUser_sales_$saleId_saleUnits_$saleUnitId(props: {
  adminUser: AdminuserPayload;
  saleId: string & tags.Format<"uuid">;
  saleUnitId: string & tags.Format<"uuid">;
  body: IShoppingMallSaleUnit.IUpdate;
}): Promise<IShoppingMallSaleUnit> {
  const { adminUser, saleId, saleUnitId, body } = props;

  const updated = await MyGlobal.prisma.shopping_mall_sale_units.update({
    where: {
      id: saleUnitId,
      shopping_mall_sale_id: saleId,
    },
    data: {
      shopping_mall_sale_id: body.shopping_mall_sale_id ?? undefined,
      code: body.code ?? undefined,
      name: body.name ?? undefined,
      description:
        body.description === null ? null : (body.description ?? undefined),
      updated_at: toISOStringSafe(new Date()),
    },
  });

  return {
    id: updated.id,
    shopping_mall_sale_id: updated.shopping_mall_sale_id,
    code: updated.code,
    name: updated.name,
    description: updated.description ?? null,
    created_at: toISOStringSafe(updated.created_at),
    updated_at: toISOStringSafe(updated.updated_at),
    deleted_at: updated.deleted_at ? toISOStringSafe(updated.deleted_at) : null,
  };
}
