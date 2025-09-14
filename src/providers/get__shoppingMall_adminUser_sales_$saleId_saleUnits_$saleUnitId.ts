import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSaleUnit } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleUnit";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Retrieves detailed information of a single sale unit belonging to a sale
 * product.
 *
 * This function ensures that only authorized admin users can access the sale
 * unit details. It fetches the sale unit identified by saleUnitId associated
 * with the sale product saleId.
 *
 * @param props - Object containing the authenticated admin user and
 *   identifiers.
 * @param props.adminUser - The authenticated admin user payload.
 * @param props.saleId - The UUID of the sale product.
 * @param props.saleUnitId - The UUID of the sale unit.
 * @returns Detailed sale unit information conforming to IShoppingMallSaleUnit.
 * @throws {Error} Throws if the sale unit is not found for the given IDs.
 */
export async function get__shoppingMall_adminUser_sales_$saleId_saleUnits_$saleUnitId(props: {
  adminUser: AdminuserPayload;
  saleId: string & tags.Format<"uuid">;
  saleUnitId: string & tags.Format<"uuid">;
}): Promise<IShoppingMallSaleUnit> {
  const { adminUser, saleId, saleUnitId } = props;

  const record =
    await MyGlobal.prisma.shopping_mall_sale_units.findFirstOrThrow({
      where: {
        id: saleUnitId,
        shopping_mall_sale_id: saleId,
      },
    });

  return {
    id: record.id,
    shopping_mall_sale_id: record.shopping_mall_sale_id,
    code: record.code,
    name: record.name,
    description: record.description ?? null,
    created_at: toISOStringSafe(record.created_at),
    updated_at: toISOStringSafe(record.updated_at),
    deleted_at: record.deleted_at ? toISOStringSafe(record.deleted_at) : null,
  };
}
