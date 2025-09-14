import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

/**
 * Confirm and apply new password for seller user password reset.
 *
 * This function verifies the password reset token's validity and linkage to the
 * seller user. Upon successful verification, it hashes the new password and
 * updates the user's password.
 *
 * @param props - Object containing sellerUser authentication payload and
 *   password reset confirmation body.
 * @param props.sellerUser - Authenticated seller user payload.
 * @param props.body - Password reset confirmation data with resetToken and
 *   newPassword.
 * @throws {Error} Throws error if token is invalid, expired, or user is not
 *   found or inactive.
 */
export async function post__auth_sellerUser_password_reset_confirm(props: {
  sellerUser: { id: string & tags.Format<"uuid">; type: "sellerUser" };
  body: IShoppingMallSellerUser.IResetPasswordConfirm;
}): Promise<void> {
  const { body } = props;

  // Verify the password reset token authenticity and payload
  let decoded: { id: string & tags.Format<"uuid"> };
  try {
    decoded = jwt.verify(body.resetToken, MyGlobal.env.JWT_SECRET_KEY) as {
      id: string & tags.Format<"uuid">;
    };
  } catch {
    throw new Error("Invalid or expired reset token");
  }

  // Lookup seller user linked to the token, check active status and not deleted
  const sellerUser = await MyGlobal.prisma.shopping_mall_sellerusers.findFirst({
    where: { id: decoded.id, status: "active", deleted_at: null },
  });

  if (!sellerUser) {
    throw new Error("Seller user not found or inactive");
  }

  // Hash the new password securely
  const hashedPassword = await MyGlobal.password.hash(body.newPassword);

  // Update user's password_hash and updated_at timestamp
  await MyGlobal.prisma.shopping_mall_sellerusers.update({
    where: { id: decoded.id },
    data: {
      password_hash: hashedPassword,
      updated_at: toISOStringSafe(new Date()),
    },
  });
}
