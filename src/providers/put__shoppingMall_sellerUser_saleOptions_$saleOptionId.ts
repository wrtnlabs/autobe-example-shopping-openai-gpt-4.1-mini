import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSaleOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleOption";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

/**
 * Update a sale option by its unique ID.
 *
 * This operation updates the sale option's code, name, type, and associated
 * option group. Only fields provided in the body are updated; other fields
 * remain unchanged. The function returns the updated sale option details,
 * including timestamps.
 *
 * @param props - The function properties including the authenticated
 *   sellerUser, the saleOptionId, and the update body.
 * @param props.sellerUser - The authenticated seller user.
 * @param props.saleOptionId - UUID of the sale option to update.
 * @param props.body - Partial data to update the sale option.
 * @returns The fully updated sale option details.
 * @throws Throws if the sale option with given ID doesn't exist.
 */
export async function put__shoppingMall_sellerUser_saleOptions_$saleOptionId(props: {
  sellerUser: SelleruserPayload;
  saleOptionId: string & tags.Format<"uuid">;
  body: IShoppingMallSaleOption.IUpdate;
}): Promise<IShoppingMallSaleOption> {
  const { sellerUser, saleOptionId, body } = props;

  // Verify sale option exists
  await MyGlobal.prisma.shopping_mall_sale_options.findUniqueOrThrow({
    where: { id: saleOptionId },
  });

  // Perform update with only provided fields
  const updated = await MyGlobal.prisma.shopping_mall_sale_options.update({
    where: { id: saleOptionId },
    data: {
      shopping_mall_sale_option_group_id:
        body.shopping_mall_sale_option_group_id ?? undefined,
      code: body.code ?? undefined,
      name: body.name ?? undefined,
      type: body.type ?? undefined,
      deleted_at: body.deleted_at ?? undefined,
    },
  });

  // Return updated object with proper date string conversion
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
