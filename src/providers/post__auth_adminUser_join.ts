import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Registers a new system administrator user account.
 *
 * This function handles the registration process, including checking for
 * duplicate email addresses, hashing the provided password securely, creating a
 * new admin user record in the database, and issuing JWT access and refresh
 * tokens upon successful registration.
 *
 * @param props - Object containing the registration details and authenticated
 *   adminUser context.
 * @param props.adminUser - The current authenticated admin user payload (not
 *   used in public join but required by signature).
 * @param props.body - The registration information including email,
 *   password_hash (to be hashed again), nickname, full name, and status.
 * @returns The newly created administrator user details along with JWT tokens
 *   for authentication.
 * @throws {Error} Throws an error when the email is already registered.
 */
export async function post__auth_adminUser_join(props: {
  adminUser: AdminuserPayload;
  body: IShoppingMallAdminUser.ICreate;
}): Promise<IShoppingMallAdminUser.IAuthorized> {
  const { adminUser, body } = props;

  const existingUser = await MyGlobal.prisma.shopping_mall_adminusers.findFirst(
    {
      where: { email: body.email },
    },
  );

  if (existingUser !== null) {
    throw new Error("Email already registered");
  }

  const hashedPassword = await MyGlobal.password.hash(body.password_hash);

  const now = toISOStringSafe(new Date());
  const newId = v4() as string & tags.Format<"uuid">;

  const created = await MyGlobal.prisma.shopping_mall_adminusers.create({
    data: {
      id: newId,
      email: body.email,
      password_hash: hashedPassword,
      nickname: body.nickname,
      full_name: body.full_name,
      status: body.status,
      created_at: now,
      updated_at: now,
    },
  });

  const accessTokenExpiresIn = 3600; // 1 hour
  const refreshTokenExpiresIn = 604800; // 7 days

  const accessTokenExpiry = toISOStringSafe(
    new Date(Date.now() + accessTokenExpiresIn * 1000),
  );
  const refreshTokenExpiry = toISOStringSafe(
    new Date(Date.now() + refreshTokenExpiresIn * 1000),
  );

  const accessToken = jwt.sign(
    { userId: created.id, email: created.email },
    MyGlobal.env.JWT_SECRET_KEY,
    { expiresIn: "1h", issuer: "autobe" },
  );

  const refreshToken = jwt.sign(
    { userId: created.id, tokenType: "refresh" },
    MyGlobal.env.JWT_SECRET_KEY,
    { expiresIn: "7d", issuer: "autobe" },
  );

  return {
    id: created.id,
    email: created.email,
    password_hash: created.password_hash,
    nickname: created.nickname,
    full_name: created.full_name,
    status: created.status,
    created_at: toISOStringSafe(created.created_at),
    updated_at: toISOStringSafe(created.updated_at),
    deleted_at: created.deleted_at ? toISOStringSafe(created.deleted_at) : null,
    token: {
      access: accessToken,
      refresh: refreshToken,
      expired_at: accessTokenExpiry,
      refreshable_until: refreshTokenExpiry,
    },
  };
}
