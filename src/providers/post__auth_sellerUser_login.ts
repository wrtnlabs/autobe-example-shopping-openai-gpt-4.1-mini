import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

/**
 * Authenticate seller users by email and password.
 *
 * This public endpoint verifies seller user credentials against the database.
 * It performs password verification using secure password hashing utilities. On
 * success, it issues JWT access and refresh tokens embedding seller user
 * claims.
 *
 * @param props - Object including seller user payload and login body
 * @param props.sellerUser - (Unused) Seller user payload, authentication not
 *   required
 * @param props.body - Login credentials containing email and password
 * @returns Seller user authorization data with tokens
 * @throws {Error} When credentials are invalid or user not found
 */
export async function post__auth_sellerUser_login(props: {
  sellerUser: SelleruserPayload;
  body: IShoppingMallSellerUser.ILogin;
}): Promise<IShoppingMallSellerUser.IAuthorized> {
  const { body } = props;

  // Find active seller user with the given email that is not deleted
  const user = await MyGlobal.prisma.shopping_mall_sellerusers.findFirst({
    where: {
      email: body.email,
      deleted_at: null,
      status: "active",
    },
  });

  if (!user) throw new Error("Invalid credentials");

  // Verify password using MyGlobal utilities
  const isValid = await MyGlobal.password.verify(
    body.password,
    user.password_hash,
  );
  if (!isValid) throw new Error("Invalid credentials");

  // Prepare JWT tokens
  const accessToken = jwt.sign(
    { id: user.id, type: "sellerUser" },
    MyGlobal.env.JWT_SECRET_KEY,
    { expiresIn: "1h", issuer: "autobe" },
  );
  const refreshToken = jwt.sign(
    { id: user.id, type: "sellerUser", tokenType: "refresh" },
    MyGlobal.env.JWT_SECRET_KEY,
    { expiresIn: "7d", issuer: "autobe" },
  );

  // Calculate token expiration times
  const expiredAt = toISOStringSafe(new Date(Date.now() + 3600_000));
  const refreshableUntil = toISOStringSafe(
    new Date(Date.now() + 7 * 86400_000),
  );

  // Return authorized seller user data
  return {
    id: user.id,
    email: user.email,
    password_hash: user.password_hash,
    nickname: user.nickname,
    full_name: user.full_name,
    phone_number: user.phone_number ?? null,
    status: user.status,
    business_registration_number: user.business_registration_number,
    created_at: toISOStringSafe(user.created_at),
    updated_at: toISOStringSafe(user.updated_at),
    deleted_at: user.deleted_at ? toISOStringSafe(user.deleted_at) : null,
    accessToken,
    refreshToken,
    token: {
      access: accessToken,
      refresh: refreshToken,
      expired_at: expiredAt,
      refreshable_until: refreshableUntil,
    },
  };
}
