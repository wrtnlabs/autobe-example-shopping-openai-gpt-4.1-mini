import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

/**
 * Authenticated seller user password change operation.
 *
 * This endpoint allows a logged-in seller user to change their password
 * securely by verifying the old password hash before updating to the new one.
 * It ensures only the legitimate user can perform the update.
 *
 * @param props - Object containing sellerUser authentication payload and the
 *   password change body with oldPassword and newPassword.
 * @param props.sellerUser - Authenticated seller user payload
 * @param props.body - Password change details
 * @throws {Error} When the seller user is not found, inactive, or password
 *   verification fails
 */
export async function post__auth_sellerUser_password_change(props: {
  sellerUser: SelleruserPayload;
  body: IShoppingMallSellerUser.IChangePassword;
}): Promise<void> {
  const { sellerUser, body } = props;

  // Find the active and not deleted seller user by id
  const seller = await MyGlobal.prisma.shopping_mall_sellerusers.findFirst({
    where: {
      id: sellerUser.id,
      status: "active",
      deleted_at: null,
    },
  });

  if (!seller) {
    throw new Error("Seller user not found or inactive");
  }

  // Verify the old password using stored password hash
  const isOldPasswordValid = await MyGlobal.password.verify(
    body.oldPassword,
    seller.password_hash,
  );

  if (!isOldPasswordValid) {
    throw new Error("Old password is incorrect");
  }

  // Hash the new password
  const newPasswordHash = await MyGlobal.password.hash(body.newPassword);

  // Update the seller user's password hash and updated_at timestamp
  await MyGlobal.prisma.shopping_mall_sellerusers.update({
    where: { id: sellerUser.id },
    data: {
      password_hash: newPasswordHash,
      updated_at: toISOStringSafe(new Date()),
    },
  });
}
