import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSaleSnapshot } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleSnapshot";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Retrieves detailed information about a specific snapshot of a shopping mall
 * sale product.
 *
 * This operation fetches a snapshot identified by saleId and snapshotId from
 * the shopping_mall_sale_snapshots table. The snapshot represents an immutable
 * historical state of the product for audit and rollback purposes.
 *
 * Only an authenticated admin user can perform this operation.
 *
 * @param props - Object containing authentication and parameter data
 * @param props.adminUser - Authenticated admin user performing the request
 * @param props.saleId - UUID of the sale product
 * @param props.snapshotId - UUID of the snapshot to retrieve
 * @returns The snapshot data matching IShoppingMallSaleSnapshot
 * @throws {Error} Throws if the snapshot is not found or unauthorized access
 *   occurs
 */
export async function get__shoppingMall_adminUser_sales_$saleId_snapshots_$snapshotId(props: {
  adminUser: AdminuserPayload;
  saleId: string & tags.Format<"uuid">;
  snapshotId: string & tags.Format<"uuid">;
}): Promise<IShoppingMallSaleSnapshot> {
  const { adminUser, saleId, snapshotId } = props;

  // fetch the snapshot using Prisma client
  const snapshot =
    await MyGlobal.prisma.shopping_mall_sale_snapshots.findFirstOrThrow({
      where: {
        id: snapshotId,
        shopping_mall_sale_id: saleId,
      },
    });

  return {
    id: snapshot.id,
    shopping_mall_sale_id: snapshot.shopping_mall_sale_id,
    code: snapshot.code,
    status: snapshot.status,
    name: snapshot.name,
    description: snapshot.description ?? null,
    price: snapshot.price,
    created_at: toISOStringSafe(snapshot.created_at),
  };
}
