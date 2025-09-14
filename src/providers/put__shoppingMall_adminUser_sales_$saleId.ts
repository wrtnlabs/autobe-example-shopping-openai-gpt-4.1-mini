import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSale } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSale";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Update a sales product's information.
 *
 * This function updates an existing record in the shopping_mall_sales table
 * identified by saleId. It applies changes provided in the body update object.
 *
 * Authorization: Caller must be an authorized adminUser (authorization is
 * assumed handled upstream).
 *
 * @param props - Object containing adminUser payload, saleId, and update body.
 * @param props.adminUser - Authenticated admin user performing the update.
 * @param props.saleId - UUID of the sales product to update.
 * @param props.body - Update data conforming to IShoppingMallSale.IUpdate.
 * @returns Updated sales product information matching IShoppingMallSale.
 * @throws {Error} Throws if the sale does not exist or database operation
 *   fails.
 */
export async function put__shoppingMall_adminUser_sales_$saleId(props: {
  adminUser: AdminuserPayload;
  saleId: string & tags.Format<"uuid">;
  body: IShoppingMallSale.IUpdate;
}): Promise<IShoppingMallSale> {
  const { adminUser, saleId, body } = props;

  const sale = await MyGlobal.prisma.shopping_mall_sales.findUniqueOrThrow({
    where: { id: saleId },
  });

  const updated = await MyGlobal.prisma.shopping_mall_sales.update({
    where: { id: saleId },
    data: {
      shopping_mall_channel_id: body.shopping_mall_channel_id ?? undefined,
      shopping_mall_section_id: body.shopping_mall_section_id ?? undefined,
      shopping_mall_seller_user_id:
        body.shopping_mall_seller_user_id ?? undefined,
      code: body.code ?? undefined,
      status: body.status ?? undefined,
      name: body.name ?? undefined,
      description: body.description ?? undefined,
      price: body.price ?? undefined,
      updated_at: toISOStringSafe(new Date()),
    },
  });

  return {
    id: updated.id,
    shopping_mall_channel_id: updated.shopping_mall_channel_id,
    shopping_mall_section_id: updated.shopping_mall_section_id ?? null,
    shopping_mall_seller_user_id: updated.shopping_mall_seller_user_id,
    code: updated.code,
    status: updated.status,
    name: updated.name,
    description: updated.description ?? null,
    price: updated.price,
    created_at: toISOStringSafe(updated.created_at),
    updated_at: toISOStringSafe(updated.updated_at),
    deleted_at: updated.deleted_at ? toISOStringSafe(updated.deleted_at) : null,
  };
}
