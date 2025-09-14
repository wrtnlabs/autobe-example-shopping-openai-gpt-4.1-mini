import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

/**
 * Deletes a sale option permanently by its unique identifier.
 *
 * This operation requires an authenticated seller user role. The sale option is
 * hard deleted from the database.
 *
 * @param props - An object containing authentication and sale option ID.
 * @param props.sellerUser - The authenticated seller user payload.
 * @param props.saleOptionId - The UUID of the sale option to delete.
 * @throws {Error} If the sale option does not exist.
 */
export async function delete__shoppingMall_sellerUser_saleOptions_$saleOptionId(props: {
  sellerUser: SelleruserPayload;
  saleOptionId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { sellerUser, saleOptionId } = props;

  const saleOption =
    await MyGlobal.prisma.shopping_mall_sale_options.findUnique({
      where: { id: saleOptionId },
    });
  if (!saleOption) throw new Error("Sale option not found");

  await MyGlobal.prisma.shopping_mall_sale_options.delete({
    where: { id: saleOptionId },
  });
}
