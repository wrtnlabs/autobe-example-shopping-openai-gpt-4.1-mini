import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Refresh JWT access tokens for authenticated admin users.
 *
 * This operation verifies the provided refresh token, validates the admin
 * user's status, and issues new access and refresh tokens for continued
 * authenticated sessions.
 *
 * @param props - Object containing the authenticated admin user and request
 *   body.
 * @param props.adminUser - The authenticated admin user payload.
 * @param props.body - The request body containing the refresh token.
 * @returns New authorization data including fresh JWT tokens.
 * @throws {Error} When the refresh token is missing, invalid, expired, or if
 *   the admin user is not found or inactive.
 */
export async function post__auth_adminUser_refresh(props: {
  adminUser: AdminuserPayload;
  body: IShoppingMallAdminUser.IRefresh;
}): Promise<IShoppingMallAdminUser.IAuthorized> {
  const { body } = props;

  if (!body.token || body.token.trim() === "") {
    throw new Error("Refresh token is required");
  }

  let decodedToken: any;
  try {
    decodedToken = jwt.verify(body.token, MyGlobal.env.JWT_SECRET_KEY, {
      issuer: "autobe",
    });
  } catch {
    throw new Error("Invalid or expired refresh token");
  }

  const userId = decodedToken.id as string | undefined;
  if (!userId) {
    throw new Error("Invalid token payload: missing user id");
  }

  const user = await MyGlobal.prisma.shopping_mall_adminusers.findFirst({
    where: {
      id: userId,
      status: "active",
      deleted_at: null,
    },
  });

  if (!user) {
    throw new Error("Admin user not found or inactive");
  }

  const now = toISOStringSafe(new Date());
  const accessTokenExpiresIn = 60 * 60; // 1 hour in seconds
  const refreshTokenExpiresIn = 7 * 24 * 60 * 60; // 7 days in seconds

  const accessTokenPayload = {
    id: user.id,
    type: "adminuser",
  };

  const accessToken = jwt.sign(
    accessTokenPayload,
    MyGlobal.env.JWT_SECRET_KEY,
    {
      expiresIn: accessTokenExpiresIn,
      issuer: "autobe",
    },
  );

  const refreshTokenPayload = {
    id: user.id,
    type: "adminuser",
    tokenType: "refresh",
  };

  const refreshToken = jwt.sign(
    refreshTokenPayload,
    MyGlobal.env.JWT_SECRET_KEY,
    {
      expiresIn: refreshTokenExpiresIn,
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
      expired_at: toISOStringSafe(
        new Date(Date.now() + accessTokenExpiresIn * 1000),
      ),
      refreshable_until: toISOStringSafe(
        new Date(Date.now() + refreshTokenExpiresIn * 1000),
      ),
    },
  };
}
