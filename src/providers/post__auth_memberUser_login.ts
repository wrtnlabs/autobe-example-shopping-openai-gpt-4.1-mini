import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * Member user login operation.
 *
 * Authenticates the member user by verifying the provided email and password.
 * Checks that the user account is active and not soft deleted. On success,
 * returns the member user's information along with JWT access and refresh
 * tokens.
 *
 * @param props - Request properties containing the login credentials.
 * @param props.body - Login credentials including email and password.
 * @returns The authenticated member user's data with authorization tokens.
 * @throws {Error} If email does not exist, user is not active, or password
 *   verification fails.
 */
export async function post__auth_memberUser_login(props: {
  body: IShoppingMallMemberUser.ILogin;
}): Promise<IShoppingMallMemberUser.IAuthorized> {
  const { body } = props;

  const user = await MyGlobal.prisma.shopping_mall_memberusers.findFirst({
    where: {
      email: body.email,
      status: "active",
      deleted_at: null,
    },
  });

  if (!user) throw new Error("Invalid email or password");

  const isPasswordValid = await MyGlobal.password.verify(
    body.password,
    user.password_hash,
  );

  if (!isPasswordValid) throw new Error("Invalid email or password");

  const now = new Date();
  const accessExpiry = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour
  const refreshExpiry = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

  const accessToken = jwt.sign(
    {
      id: user.id,
      email: user.email,
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
    phone_number: user.phone_number ?? null,
    status: user.status,
    created_at: toISOStringSafe(user.created_at),
    updated_at: toISOStringSafe(user.updated_at),
    deleted_at: user.deleted_at ? toISOStringSafe(user.deleted_at) : null,
    token: {
      access: accessToken,
      refresh: refreshToken,
      expired_at: toISOStringSafe(accessExpiry),
      refreshable_until: toISOStringSafe(refreshExpiry),
    },
  };
}
