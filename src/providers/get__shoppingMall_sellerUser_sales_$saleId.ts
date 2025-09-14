import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSale } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSale";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

/**
 * Retrieve detailed sales product information by saleId for the authenticated
 * seller user.
 *
 * This function ensures that the requesting seller user owns the product,
 * returning comprehensive product details including channel, section, seller
 * reference, code, status, name, description, price, and auditing timestamps.
 *
 * @param props - Object containing sellerUser payload and the saleId string
 * @param props.sellerUser - Authenticated seller user payload with id
 * @param props.saleId - UUID string of the sales product to retrieve
 * @returns Detailed sale product information complying with IShoppingMallSale
 * @throws Will throw if the sale product does not exist or if the sellerUser is
 *   not authorized
 */
export async function get__shoppingMall_sellerUser_sales_$saleId(props: {
  sellerUser: SelleruserPayload;
  saleId: string & tags.Format<"uuid">;
}): Promise<IShoppingMallSale> {
  const { sellerUser, saleId } = props;

  const sale = await MyGlobal.prisma.shopping_mall_sales.findFirstOrThrow({
    where: {
      id: saleId,
      shopping_mall_seller_user_id: sellerUser.id,
      deleted_at: null,
    },
  });

  return {
    id: sale.id,
    shopping_mall_channel_id: sale.shopping_mall_channel_id,
    shopping_mall_section_id: sale.shopping_mall_section_id ?? null,
    shopping_mall_seller_user_id: sale.shopping_mall_seller_user_id,
    code: sale.code,
    status: sale.status,
    name: sale.name,
    description: sale.description ?? null,
    price: sale.price,
    created_at: toISOStringSafe(sale.created_at),
    updated_at: toISOStringSafe(sale.updated_at),
    deleted_at: sale.deleted_at ? toISOStringSafe(sale.deleted_at) : null,
  };
}
