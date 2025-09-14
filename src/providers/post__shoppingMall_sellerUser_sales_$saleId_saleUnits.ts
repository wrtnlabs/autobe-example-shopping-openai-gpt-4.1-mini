import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSaleUnit } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleUnit";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

/**
 * Create a new sale unit for a specific sale product owned by the seller user.
 *
 * This operation validates that the sale product with the given saleId exists
 * and belongs to the authenticated sellerUser. Then, it creates a new sale unit
 * using the provided code, name, and optional description. The timestamps are
 * generated automatically.
 *
 * @param props - Object containing sellerUser payload, saleId, and sale unit
 *   creation data
 * @param props.sellerUser - Authenticated seller user performing the operation
 * @param props.saleId - UUID string of the sale product under which to create
 *   the unit
 * @param props.body - Creation payload for the sale unit
 * @returns The newly created sale unit with full fields including timestamps
 * @throws {Error} When the sale product does not exist
 * @throws {Error} When the sellerUser is not the owner of the sale product
 */
export async function post__shoppingMall_sellerUser_sales_$saleId_saleUnits(props: {
  sellerUser: SelleruserPayload;
  saleId: string & tags.Format<"uuid">;
  body: IShoppingMallSaleUnit.ICreate;
}): Promise<IShoppingMallSaleUnit> {
  const { sellerUser, saleId, body } = props;

  const sale = await MyGlobal.prisma.shopping_mall_sales.findUnique({
    where: { id: saleId },
  });

  if (!sale) {
    throw new Error(`Sale product with id ${saleId} not found`);
  }

  if (sale.shopping_mall_seller_user_id !== sellerUser.id) {
    throw new Error(
      `Unauthorized: sellerUser cannot add sale unit to sale product ${saleId}`,
    );
  }

  const now = toISOStringSafe(new Date());
  const id = v4() as string & tags.Format<"uuid">;

  const created = await MyGlobal.prisma.shopping_mall_sale_units.create({
    data: {
      id: id,
      shopping_mall_sale_id: saleId,
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
    description: created.description,
    created_at: toISOStringSafe(created.created_at),
    updated_at: toISOStringSafe(created.updated_at),
    deleted_at: created.deleted_at ? toISOStringSafe(created.deleted_at) : null,
  };
}
