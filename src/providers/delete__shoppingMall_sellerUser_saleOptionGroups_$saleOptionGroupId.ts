import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

/**
 * Delete sale option group by ID
 *
 * This operation permanently deletes a sale option group identified by the
 * given ID. The deletion is hard and irreversible.
 *
 * Authorization is required and must be validated by the calling context.
 *
 * @param props - The operation parameters
 * @param props.sellerUser - The authenticated seller user performing the
 *   deletion
 * @param props.saleOptionGroupId - The UUID identifier of the sale option group
 *   to delete
 * @throws {Error} Throws if the sale option group ID does not exist or deletion
 *   fails
 */
export async function delete__shoppingMall_sellerUser_saleOptionGroups_$saleOptionGroupId(props: {
  sellerUser: SelleruserPayload;
  saleOptionGroupId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { sellerUser, saleOptionGroupId } = props;

  // Execute hard deletion directly; prisma throws error if ID not found
  await MyGlobal.prisma.shopping_mall_sale_option_groups.delete({
    where: {
      id: saleOptionGroupId,
    },
  });
}
