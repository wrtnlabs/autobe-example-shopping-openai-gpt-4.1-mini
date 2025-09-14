import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSaleUnit } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleUnit";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Creates a new sale unit within a specified shopping mall sale product.
 *
 * This operation allows admin users to add detailed components or sub-parts of
 * an existing sale product. The sale unit must have a unique code, name, and
 * optional description. The system generates the entity's UUID and timestamps
 * upon creation.
 *
 * @param props - Object containing adminUser payload, sale product ID, and sale
 *   unit creation data
 * @param props.adminUser - Authenticated admin user performing the creation
 * @param props.saleId - UUID of the sale product under which the unit is
 *   created
 * @param props.body - Details of the new sale unit to be created
 * @returns The newly created sale unit including all system-generated fields
 * @throws {Error} If the saleId path parameter does not match the
 *   body.shopping_mall_sale_id
 */
export async function post__shoppingMall_adminUser_sales_$saleId_saleUnits(props: {
  adminUser: AdminuserPayload;
  saleId: string & tags.Format<"uuid">;
  body: IShoppingMallSaleUnit.ICreate;
}): Promise<IShoppingMallSaleUnit> {
  const { adminUser, saleId, body } = props;

  if (saleId !== body.shopping_mall_sale_id) {
    throw new Error(
      "Path parameter saleId does not match body.shopping_mall_sale_id",
    );
  }

  const now = toISOStringSafe(new Date());

  const created = await MyGlobal.prisma.shopping_mall_sale_units.create({
    data: {
      id: v4() as string & tags.Format<"uuid">,
      shopping_mall_sale_id: body.shopping_mall_sale_id,
      code: body.code,
      name: body.name,
      description: body.description ?? null,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    },
  });

  return {
    id: created.id,
    shopping_mall_sale_id: created.shopping_mall_sale_id,
    code: created.code,
    name: created.name,
    description: created.description ?? null,
    created_at: toISOStringSafe(created.created_at),
    updated_at: toISOStringSafe(created.updated_at),
    deleted_at: created.deleted_at ? toISOStringSafe(created.deleted_at) : null,
  };
}
