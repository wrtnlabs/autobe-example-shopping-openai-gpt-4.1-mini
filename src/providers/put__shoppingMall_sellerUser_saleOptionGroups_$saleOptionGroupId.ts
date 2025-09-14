import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSaleOptionGroup } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleOptionGroup";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

/**
 * Update sale option group details by ID.
 *
 * Allows modifications of code, name, and deletion status. Requires the
 * authenticated seller user. Throws an error if the sale option group does not
 * exist.
 *
 * @param props - Object containing sellerUser, saleOptionGroupId and update
 *   body
 * @param props.sellerUser - Authenticated seller user payload
 * @param props.saleOptionGroupId - UUID of the sale option group to update
 * @param props.body - Partial update data for the sale option group
 * @returns Returns the updated sale option group with all properties
 * @throws {Error} Throws when the sale option group does not exist
 */
export async function put__shoppingMall_sellerUser_saleOptionGroups_$saleOptionGroupId(props: {
  sellerUser: SelleruserPayload;
  saleOptionGroupId: string & tags.Format<"uuid">;
  body: IShoppingMallSaleOptionGroup.IUpdate;
}): Promise<IShoppingMallSaleOptionGroup> {
  const { sellerUser, saleOptionGroupId, body } = props;

  // Verify the sale option group exists
  const existing =
    await MyGlobal.prisma.shopping_mall_sale_option_groups.findUnique({
      where: { id: saleOptionGroupId },
    });

  if (!existing) {
    throw new Error(`SaleOptionGroup with id ${saleOptionGroupId} not found`);
  }

  // Perform update
  const updated = await MyGlobal.prisma.shopping_mall_sale_option_groups.update(
    {
      where: { id: saleOptionGroupId },
      data: {
        code: body.code ?? undefined,
        name: body.name ?? undefined,
        deleted_at:
          body.deleted_at === null ? null : (body.deleted_at ?? undefined),
        updated_at: toISOStringSafe(new Date()),
      },
    },
  );

  // Return updated record with date strings
  return {
    id: updated.id,
    code: updated.code,
    name: updated.name,
    deleted_at: updated.deleted_at ? toISOStringSafe(updated.deleted_at) : null,
    created_at: toISOStringSafe(updated.created_at),
    updated_at: toISOStringSafe(updated.updated_at),
  };
}
