import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSale } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSale";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

/**
 * Create a new sales product record.
 *
 * This function enables an authorized seller user to register a new product for
 * sale in the shopping mall system. It ensures all required fields are saved
 * and the created record is returned with all timestamps properly formatted as
 * ISO 8601 string with brand types.
 *
 * @param props - The properties including the authenticated sellerUser and the
 *   product data to create.
 * @param props.sellerUser - The authenticated seller user payload.
 * @param props.body - The creation data for the new sales product.
 * @returns The created sales product record with all relevant fields.
 * @throws {Error} Throws error if database operation fails or data violates
 *   constraints.
 */
export async function post__shoppingMall_sellerUser_sales(props: {
  sellerUser: SelleruserPayload;
  body: IShoppingMallSale.ICreate;
}): Promise<IShoppingMallSale> {
  const { sellerUser, body } = props;

  const id = v4() as string & tags.Format<"uuid">;

  const now = toISOStringSafe(new Date());

  const created = await MyGlobal.prisma.shopping_mall_sales.create({
    data: {
      id,
      shopping_mall_channel_id: body.shopping_mall_channel_id,
      shopping_mall_section_id: body.shopping_mall_section_id ?? null,
      shopping_mall_seller_user_id: body.shopping_mall_seller_user_id,
      code: body.code,
      status: body.status,
      name: body.name,
      description: body.description ?? null,
      price: body.price,
      created_at: now,
      updated_at: now,
    },
  });

  return {
    id: created.id as string & tags.Format<"uuid">,
    shopping_mall_channel_id: created.shopping_mall_channel_id as string &
      tags.Format<"uuid">,
    shopping_mall_section_id: created.shopping_mall_section_id
      ? (created.shopping_mall_section_id as string & tags.Format<"uuid">)
      : null,
    shopping_mall_seller_user_id:
      created.shopping_mall_seller_user_id as string & tags.Format<"uuid">,
    code: created.code,
    status: created.status,
    name: created.name,
    description: created.description ?? null,
    price: created.price,
    created_at: toISOStringSafe(created.created_at),
    updated_at: toISOStringSafe(created.updated_at),
    deleted_at: created.deleted_at ? toISOStringSafe(created.deleted_at) : null,
  };
}
