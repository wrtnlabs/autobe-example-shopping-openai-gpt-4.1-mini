import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSaleOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleOption";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Update a sale option by its unique ID.
 *
 * This function updates the details of a sale option, including its code, name,
 * type, and the associated sale option group ID. It also updates the timestamp
 * for record modification.
 *
 * Authorization is required via an authenticated adminUser provided in props.
 *
 * @param props - Object containing adminUser payload, saleOptionId, and update
 *   data
 * @param props.adminUser - Authenticated admin user performing the update
 * @param props.saleOptionId - Unique UUID string identifying the sale option to
 *   update
 * @param props.body - The update data for the sale option following
 *   IShoppingMallSaleOption.IUpdate schema
 * @returns The updated sale option record conforming to IShoppingMallSaleOption
 * @throws {Error} If the sale option with the given ID does not exist
 */
export async function put__shoppingMall_adminUser_saleOptions_$saleOptionId(props: {
  adminUser: AdminuserPayload;
  saleOptionId: string & tags.Format<"uuid">;
  body: IShoppingMallSaleOption.IUpdate;
}): Promise<IShoppingMallSaleOption> {
  const { adminUser, saleOptionId, body } = props;

  const updated = await MyGlobal.prisma.shopping_mall_sale_options.update({
    where: { id: saleOptionId },
    data: {
      shopping_mall_sale_option_group_id:
        body.shopping_mall_sale_option_group_id ?? undefined,
      code: body.code ?? undefined,
      name: body.name ?? undefined,
      type: body.type ?? undefined,
      deleted_at: body.deleted_at ?? undefined,
      updated_at: toISOStringSafe(new Date()),
    },
  });

  return {
    id: updated.id,
    shopping_mall_sale_option_group_id:
      updated.shopping_mall_sale_option_group_id,
    code: updated.code,
    name: updated.name,
    type: updated.type,
    created_at: toISOStringSafe(updated.created_at),
    updated_at: toISOStringSafe(updated.updated_at),
    deleted_at: updated.deleted_at ? toISOStringSafe(updated.deleted_at) : null,
  };
}
