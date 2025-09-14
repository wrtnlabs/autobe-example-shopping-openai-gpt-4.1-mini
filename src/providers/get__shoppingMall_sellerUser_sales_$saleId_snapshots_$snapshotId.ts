import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSaleSnapshot } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSaleSnapshot";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

/**
 * Retrieves detailed information of a specific sale snapshot associated with a
 * seller user's sale product.
 *
 * This operation ensures the requesting seller owns the sale product identified
 * by `saleId` before returning the snapshot.
 *
 * @param props - Request properties containing:
 *
 *   - SellerUser: The authenticated seller user payload
 *   - SaleId: The UUID of the sale product
 *   - SnapshotId: The UUID of the sale snapshot
 *
 * @returns The detailed sale snapshot matching the provided IDs
 * @throws {Error} When the seller user is not authorized for the sale
 * @throws {Error} When the snapshot does not exist for the sale
 */
export async function get__shoppingMall_sellerUser_sales_$saleId_snapshots_$snapshotId(props: {
  sellerUser: SelleruserPayload;
  saleId: string & tags.Format<"uuid">;
  snapshotId: string & tags.Format<"uuid">;
}): Promise<IShoppingMallSaleSnapshot> {
  const { sellerUser, saleId, snapshotId } = props;

  // Verify that the sale exists and the seller user owns it
  const sale = await MyGlobal.prisma.shopping_mall_sales.findUniqueOrThrow({
    where: { id: saleId },
    select: { shopping_mall_seller_user_id: true },
  });

  if (sale.shopping_mall_seller_user_id !== sellerUser.id) {
    throw new Error("Unauthorized: You do not own this sale product");
  }

  // Fetch the sale snapshot verifying it belongs to the sale
  const snapshot =
    await MyGlobal.prisma.shopping_mall_sale_snapshots.findUniqueOrThrow({
      where: { id: snapshotId },
    });

  if (snapshot.shopping_mall_sale_id !== saleId) {
    throw new Error("Snapshot does not belong to the specified sale");
  }

  // Return the snapshot with date fields converted
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
