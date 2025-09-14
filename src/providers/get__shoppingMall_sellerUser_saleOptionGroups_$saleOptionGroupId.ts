import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSaleOptionGroup } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleOptionGroup";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

/**
 * Retrieve details of a specific sale option group by its unique identifier.
 *
 * This operation fetches the sale option group record that matches the provided
 * saleOptionGroupId and is not soft deleted (deleted_at is null).
 *
 * Requires sellerUser authorization prior to calling this function.
 *
 * @param props - Object containing sellerUser payload and saleOptionGroupId
 * @param props.sellerUser - Authenticated sellerUser payload
 * @param props.saleOptionGroupId - Unique identifier of the sale option group
 * @returns The detailed sale option group data fulfilling
 *   IShoppingMallSaleOptionGroup
 * @throws {Error} When no sale option group with the provided ID exists
 */
export async function get__shoppingMall_sellerUser_saleOptionGroups_$saleOptionGroupId(props: {
  sellerUser: SelleruserPayload;
  saleOptionGroupId: string & tags.Format<"uuid">;
}): Promise<IShoppingMallSaleOptionGroup> {
  const { sellerUser, saleOptionGroupId } = props;

  // Find sale option group where id matches and deleted_at is null
  const saleOptionGroup =
    await MyGlobal.prisma.shopping_mall_sale_option_groups.findFirst({
      where: { id: saleOptionGroupId, deleted_at: null },
    });

  if (!saleOptionGroup) {
    throw new Error("Sale option group not found");
  }

  // Return with date conversions to string & tags.Format<'date-time'>
  return {
    id: saleOptionGroup.id,
    code: saleOptionGroup.code,
    name: saleOptionGroup.name,
    created_at: toISOStringSafe(saleOptionGroup.created_at),
    updated_at: toISOStringSafe(saleOptionGroup.updated_at),
    deleted_at: saleOptionGroup.deleted_at
      ? toISOStringSafe(saleOptionGroup.deleted_at)
      : null,
  };
}
