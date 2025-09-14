import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSaleOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleOption";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

/**
 * Get detailed sale option information
 *
 * Retrieves detailed information for a specific sale option by its unique ID.
 * Requires sellerUser authorization.
 *
 * @param props - Object with sellerUser and saleOptionId
 * @param props.sellerUser - Authenticated seller user payload
 * @param props.saleOptionId - Unique UUID of the sale option
 * @returns Detailed sale option information
 * @throws {Error} When sale option is not found
 */
export async function get__shoppingMall_sellerUser_saleOptions_$saleOptionId(props: {
  sellerUser: SelleruserPayload;
  saleOptionId: string & tags.Format<"uuid">;
}): Promise<IShoppingMallSaleOption> {
  const { saleOptionId } = props;

  const saleOption =
    await MyGlobal.prisma.shopping_mall_sale_options.findUniqueOrThrow({
      where: { id: saleOptionId },
      select: {
        id: true,
        shopping_mall_sale_option_group_id: true,
        code: true,
        name: true,
        type: true,
        created_at: true,
        updated_at: true,
        deleted_at: true,
      },
    });

  return {
    id: saleOption.id,
    shopping_mall_sale_option_group_id:
      saleOption.shopping_mall_sale_option_group_id,
    code: saleOption.code,
    name: saleOption.name,
    type: saleOption.type,
    created_at: toISOStringSafe(saleOption.created_at),
    updated_at: toISOStringSafe(saleOption.updated_at),
    deleted_at: saleOption.deleted_at
      ? toISOStringSafe(saleOption.deleted_at)
      : null,
  };
}
