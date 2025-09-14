import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSaleOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleOption";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Get detailed sale option information
 *
 * Retrieves detailed information for a specific sale option by its unique
 * identifier. Access is restricted to authenticated users with adminUser or
 * sellerUser roles.
 *
 * @param props - Object containing the authenticated adminUser and target
 *   saleOptionId
 * @param props.adminUser - The authenticated adminUser payload
 * @param props.saleOptionId - The UUID of the sale option to retrieve
 * @returns A Promise that resolves to the detailed sale option information
 * @throws {Error} Throws if the sale option does not exist or is soft deleted
 */
export async function get__shoppingMall_adminUser_saleOptions_$saleOptionId(props: {
  adminUser: AdminuserPayload;
  saleOptionId: string & tags.Format<"uuid">;
}): Promise<IShoppingMallSaleOption> {
  const { saleOptionId } = props;

  const saleOption =
    await MyGlobal.prisma.shopping_mall_sale_options.findUniqueOrThrow({
      where: {
        id: saleOptionId,
        deleted_at: null,
      },
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
