import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSale } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSale";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

/**
 * Update a sales product's information.
 *
 * This operation allows an authenticated seller user to modify the details of a
 * sales product identified by its unique ID. Only the owning seller user is
 * authorized to perform this update.
 *
 * @param props - Object containing sellerUser payload, saleId path parameter,
 *   and update payload.
 * @param props.sellerUser - The authenticated seller user performing the
 *   update.
 * @param props.saleId - Unique identifier of the sales product to update.
 * @param props.body - Partial update payload for the sales product.
 * @returns The updated sales product data.
 * @throws {Error} When the sales product is not found.
 * @throws {Error} When the seller user is not authorized to update this
 *   product.
 */
export async function put__shoppingMall_sellerUser_sales_$saleId(props: {
  sellerUser: SelleruserPayload;
  saleId: string & tags.Format<"uuid">;
  body: IShoppingMallSale.IUpdate;
}): Promise<IShoppingMallSale> {
  const { sellerUser, saleId, body } = props;

  // Fetch existing sale record
  const sale = await MyGlobal.prisma.shopping_mall_sales.findUnique({
    where: { id: saleId },
  });

  if (!sale) {
    throw new Error("Sale product not found");
  }

  // Authorization check: must own the sale
  if (sale.shopping_mall_seller_user_id !== sellerUser.id) {
    throw new Error("Unauthorized: You can only update your own sales");
  }

  // Perform update
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
      description:
        body.description === null ? null : (body.description ?? undefined),
      price: body.price ?? undefined,
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
