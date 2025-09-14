import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Authenticate system administrator users and issue JWT tokens.
 *
 * This operation validates administrator credentials against stored records in
 * shopping_mall_adminusers.
 *
 * On success, it issues JWT tokens that grant access to admin resources and
 * operations.
 *
 * Security mechanisms prevent brute force attacks and credential leaks.
 *
 * This operation pairs with join and refresh endpoints to maintain admin
 * authentication lifecycles.
 *
 * @param props - Object containing adminUser payload and login body.
 * @param props.adminUser - The authenticated admin user payload (not used in
 *   login).
 * @param props.body - Login credentials for admin users including email and
 *   password.
 * @returns Authorized admin user information including JWT tokens.
 * @throws {Error} When credentials are invalid or user is inactive.
 */
export async function post__auth_adminUser_login(props: {
  adminUser: AdminuserPayload;
  body: IShoppingMallAdminUser.ILogin;
}): Promise<IShoppingMallAdminUser.IAuthorized> {
  const { body } = props;

  const user = await MyGlobal.prisma.shopping_mall_adminusers.findFirst({
    where: {
      email: body.email,
      deleted_at: null,
      status: "active",
    },
  });

  if (!user) throw new Error("Invalid credentials");

  const isValidPassword = await MyGlobal.password.verify(
    body.password_hash,
    user.password_hash,
  );

  if (!isValidPassword) throw new Error("Invalid credentials");

  const now = Date.now();
  const accessExpiresInMs = 3600 * 1000; // 1 hour
  const refreshExpiresInMs = 7 * 24 * 3600 * 1000; // 7 days

  const accessExpiredAt = toISOStringSafe(new Date(now + accessExpiresInMs));
  const refreshableUntil = toISOStringSafe(new Date(now + refreshExpiresInMs));

  const accessToken = jwt.sign(
    {
      id: user.id,
      email: user.email,
      type: "adminuser",
    },
    MyGlobal.env.JWT_SECRET_KEY,
    {
      expiresIn: "1h",
      issuer: "autobe",
    },
  );

  const refreshToken = jwt.sign(
    {
      id: user.id,
      tokenType: "refresh",
    },
    MyGlobal.env.JWT_SECRET_KEY,
    {
      expiresIn: "7d",
      issuer: "autobe",
    },
  );

  return {
    id: user.id,
    email: user.email,
    password_hash: user.password_hash,
    nickname: user.nickname,
    full_name: user.full_name,
    status: user.status,
    created_at: toISOStringSafe(user.created_at),
    updated_at: toISOStringSafe(user.updated_at),
    deleted_at: user.deleted_at ? toISOStringSafe(user.deleted_at) : null,
    token: {
      access: accessToken,
      refresh: refreshToken,
      expired_at: accessExpiredAt,
      refreshable_until: refreshableUntil,
    },
  };
}
