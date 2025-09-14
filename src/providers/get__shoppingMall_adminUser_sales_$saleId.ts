import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSale } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSale";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Retrieve detailed information of a single sales product by its unique
 * identifier.
 *
 * This operation is restricted to authenticated users with the 'adminUser'
 * role. It fetches comprehensive product details from the 'shopping_mall_sales'
 * table, including associated channel, section, and seller IDs, status,
 * pricing, and timestamps.
 *
 * @param props - The function arguments including authentication payload and
 *   sale ID.
 * @param props.adminUser - Authenticated admin user payload.
 * @param props.saleId - Unique identifier of the sales product to retrieve.
 * @returns Comprehensive sales product details conforming to IShoppingMallSale.
 * @throws {Error} If the provided saleId does not exist or the product has been
 *   deleted.
 */
export async function get__shoppingMall_adminUser_sales_$saleId(props: {
  adminUser: AdminuserPayload;
  saleId: string & tags.Format<"uuid">;
}): Promise<IShoppingMallSale> {
  const { adminUser, saleId } = props;

  const record = await MyGlobal.prisma.shopping_mall_sales.findFirstOrThrow({
    where: {
      id: saleId,
      deleted_at: null,
    },
    select: {
      id: true,
      shopping_mall_channel_id: true,
      shopping_mall_section_id: true,
      shopping_mall_seller_user_id: true,
      code: true,
      status: true,
      name: true,
      description: true,
      price: true,
      created_at: true,
      updated_at: true,
      deleted_at: true,
    },
  });

  return {
    id: record.id,
    shopping_mall_channel_id: record.shopping_mall_channel_id,
    shopping_mall_section_id: record.shopping_mall_section_id ?? null,
    shopping_mall_seller_user_id: record.shopping_mall_seller_user_id,
    code: record.code,
    status: record.status,
    name: record.name,
    description: record.description ?? null,
    price: record.price,
    created_at: toISOStringSafe(record.created_at),
    updated_at: toISOStringSafe(record.updated_at),
    deleted_at: record.deleted_at ? toISOStringSafe(record.deleted_at) : null,
  };
}
