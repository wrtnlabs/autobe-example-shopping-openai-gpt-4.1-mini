import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSaleOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleOption";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

/**
 * Creates a new sale option master record.
 *
 * This handler is restricted to authenticated seller users. It inserts a new
 * record into shopping_mall_sale_options with provided group ID, code, name,
 * and type, generating a new UUID as ID and using current timestamps.
 *
 * @param props - Object containing the authenticated sellerUser and creation
 *   body
 * @param props.sellerUser - Authenticated seller user payload
 * @param props.body - Creation data for the new sale option
 * @returns The newly created sale option with all fields populated
 * @throws {Error} Throws if database operation fails or constraints are
 *   violated
 */
export async function post__shoppingMall_sellerUser_saleOptions(props: {
  sellerUser: SelleruserPayload;
  body: IShoppingMallSaleOption.ICreate;
}): Promise<IShoppingMallSaleOption> {
  const { body } = props;
  const id = v4() as string & tags.Format<"uuid">;
  const now = toISOStringSafe(new Date());

  const created = await MyGlobal.prisma.shopping_mall_sale_options.create({
    data: {
      id,
      shopping_mall_sale_option_group_id:
        body.shopping_mall_sale_option_group_id,
      code: body.code,
      name: body.name,
      type: body.type,
      created_at: now,
      updated_at: now,
    },
  });

  return {
    id: created.id,
    shopping_mall_sale_option_group_id:
      created.shopping_mall_sale_option_group_id,
    code: created.code,
    name: created.name,
    type: created.type,
    created_at: toISOStringSafe(created.created_at),
    updated_at: toISOStringSafe(created.updated_at),
    deleted_at: created.deleted_at ? toISOStringSafe(created.deleted_at) : null,
  };
}
