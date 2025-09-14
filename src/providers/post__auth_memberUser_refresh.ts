import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * Member user token refresh operation.
 *
 * Validates provided refresh token and issues new access and refresh tokens for
 * session continuity. Ensures user account is active and not soft deleted
 * before token issuance.
 *
 * @param props - Object containing the refresh token in the request body.
 * @param props.body - Object with a valid refresh token string.
 * @returns Promise resolving to authorized member user data including tokens.
 * @throws {Error} Throws if the refresh token is invalid, expired, or user
 *   inactive.
 */
export async function post__auth_memberUser_refresh(props: {
  body: IShoppingMallMemberUser.IRefresh;
}): Promise<IShoppingMallMemberUser.IAuthorized> {
  const { body } = props;

  // Verify and decode the refresh token
  let decodedToken: unknown;
  try {
    decodedToken = jwt.verify(body.refreshToken, MyGlobal.env.JWT_SECRET_KEY, {
      issuer: "autobe",
    });
  } catch {
    throw new Error("Invalid or expired refresh token");
  }

  // Validate payload id existence and type
  if (
    typeof decodedToken !== "object" ||
    decodedToken === null ||
    !("id" in decodedToken) ||
    typeof (decodedToken as any).id !== "string"
  ) {
    throw new Error("Invalid refresh token payload: Missing user id");
  }
  const userId = (decodedToken as { id: string }).id;

  // Retrieve active member user who is not soft deleted
  const user = await MyGlobal.prisma.shopping_mall_memberusers.findFirst({
    where: {
      id: userId,
      status: "active",
      deleted_at: null,
    },
  });

  if (!user) {
    throw new Error("User not found or inactive");
  }

  // Generate new access token
  const accessToken = jwt.sign(
    {
      id: user.id,
      email: user.email,
      nickname: user.nickname,
      full_name: user.full_name,
      phone_number: user.phone_number ?? null,
      status: user.status,
    },
    MyGlobal.env.JWT_SECRET_KEY,
    {
      expiresIn: "1h",
      issuer: "autobe",
    },
  );

  // Generate new refresh token
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

  // Calculate access token expiration ISO string
  const accessExpiration: string & tags.Format<"date-time"> = toISOStringSafe(
    new Date(Date.now() + 3600 * 1000),
  );

  // Calculate refresh token expiration ISO string
  const refreshExpiration: string & tags.Format<"date-time"> = toISOStringSafe(
    new Date(Date.now() + 7 * 24 * 3600 * 1000),
  );

  // Return the authorized user with tokens
  return {
    id: user.id,
    email: user.email,
    password_hash: user.password_hash,
    nickname: user.nickname,
    full_name: user.full_name,
    phone_number: user.phone_number ?? null,
    status: user.status,
    created_at: toISOStringSafe(user.created_at),
    updated_at: toISOStringSafe(user.updated_at),
    deleted_at: user.deleted_at ? toISOStringSafe(user.deleted_at) : null,
    token: {
      access: accessToken,
      refresh: refreshToken,
      expired_at: accessExpiration,
      refreshable_until: refreshExpiration,
    },
  };
}
