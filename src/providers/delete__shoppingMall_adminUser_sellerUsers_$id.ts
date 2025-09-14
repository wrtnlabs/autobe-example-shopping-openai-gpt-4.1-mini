import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

export async function delete__shoppingMall_adminUser_sellerUsers_$id(props: {
  adminUser: AdminuserPayload;
  id: string & tags.Format<"uuid">;
}): Promise<void> {
  const { adminUser, id } = props;
  const now = toISOStringSafe(new Date());

  // Verify the seller user exists and is not already deleted
  await MyGlobal.prisma.shopping_mall_sellerusers.findUniqueOrThrow({
    where: { id },
  });

  // Perform the soft delete by setting deleted_at
  await MyGlobal.prisma.shopping_mall_sellerusers.update({
    where: { id },
    data: { deleted_at: now },
  });
}
