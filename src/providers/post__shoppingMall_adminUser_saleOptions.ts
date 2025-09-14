import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSaleOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleOption";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Create a new sale option master record with group ID, code, name, and type.
 *
 * Accessible only to sellerUser and adminUser roles.
 *
 * @param props - Object containing adminUser information and the creation body
 * @param props.adminUser - Authenticated administrator user executing this
 *   operation
 * @param props.body - Creation data for the new sale option
 * @returns The created sale option record including id and timestamps
 * @throws {Error} Throws if the database operation fails
 */
export async function post__shoppingMall_adminUser_saleOptions(props: {
  adminUser: AdminuserPayload;
  body: IShoppingMallSaleOption.ICreate;
}): Promise<IShoppingMallSaleOption> {
  const { adminUser, body } = props;

  // Generate new UUID for the sale option
  const id = v4() as string & tags.Format<"uuid">;
  // Get current timestamp as ISO string
  const now = toISOStringSafe(new Date());

  // Create new sale option record
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
      deleted_at: null,
    },
  });

  // Return the created record with correctly formatted datetime fields
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
