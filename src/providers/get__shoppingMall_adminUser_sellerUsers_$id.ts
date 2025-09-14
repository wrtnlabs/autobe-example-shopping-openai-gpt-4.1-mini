import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Retrieves detailed information of a specific shopping mall seller user by ID.
 *
 * This endpoint is designed for administrative use, providing comprehensive
 * seller profile information including business registration data, contact
 * info, and account status.
 *
 * Password hash is included as per API structure for internal use but should be
 * protected by authorization.
 *
 * @param props - Object containing the authenticated adminUser payload and
 *   seller user ID.
 * @param props.adminUser - Authenticated admin user making the request.
 * @param props.id - UUID of the seller user to retrieve.
 * @returns Detailed seller user information excluding sensitive external data.
 * @throws {Error} When the specified seller user is not found or is
 *   soft-deleted.
 */
export async function get__shoppingMall_adminUser_sellerUsers_$id(props: {
  adminUser: AdminuserPayload;
  id: string & tags.Format<"uuid">;
}): Promise<IShoppingMallSellerUser> {
  const { id } = props;

  const sellerUser = await MyGlobal.prisma.shopping_mall_sellerusers.findFirst({
    where: {
      id,
      deleted_at: null,
    },
  });

  if (!sellerUser) throw new Error("Seller user not found");

  return {
    id: sellerUser.id,
    email: sellerUser.email,
    password_hash: sellerUser.password_hash,
    nickname: sellerUser.nickname,
    full_name: sellerUser.full_name,
    phone_number: sellerUser.phone_number ?? null,
    status: sellerUser.status,
    business_registration_number: sellerUser.business_registration_number,
    created_at: toISOStringSafe(sellerUser.created_at),
    updated_at: toISOStringSafe(sellerUser.updated_at),
    deleted_at: sellerUser.deleted_at
      ? toISOStringSafe(sellerUser.deleted_at)
      : null,
  };
}
