import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * Member user registration operation.
 *
 * This function registers a new member user in the shopping mall system by
 * creating a new member user record with credentials and profile information.
 * It hashes the password before storing, generates UUID and timestamps, and
 * returns the created user's information along with JWT access and refresh
 * tokens.
 *
 * @param props - Object containing the request body with user registration data
 * @param props.body - The member user creation data including email,
 *   password_hash, nickname, full_name, phone_number, and status
 * @returns The authorized member user information including id, profile data,
 *   timestamps, and JWT tokens
 * @throws {Error} Throws if email already exists (unique constraint violation)
 *   or on other database errors
 */
export async function post__auth_memberUser_join(props: {
  body: IShoppingMallMemberUser.ICreate;
}): Promise<IShoppingMallMemberUser.IAuthorized> {
  const { body } = props;

  // Generate a new UUID for the member user id
  const id = v4() as string & tags.Format<"uuid">;

  // Generate current timestamp for created_at and updated_at
  const now = toISOStringSafe(new Date()) as string & tags.Format<"date-time">;

  // Hash the plain password provided in body.password_hash
  const hashedPassword = await MyGlobal.password.hash(body.password_hash);

  // Create the new member user record in the database
  const created = await MyGlobal.prisma.shopping_mall_memberusers.create({
    data: {
      id,
      email: body.email,
      password_hash: hashedPassword,
      nickname: body.nickname,
      full_name: body.full_name,
      phone_number: body.phone_number ?? null,
      status: body.status,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    },
  });

  // Generate access token with 1 hour expiry
  const accessExpiredAt = toISOStringSafe(
    new Date(Date.now() + 3600 * 1000),
  ) as string & tags.Format<"date-time">;

  // Generate refresh token with 7 days expiry
  const refreshableUntil = toISOStringSafe(
    new Date(Date.now() + 7 * 24 * 3600 * 1000),
  ) as string & tags.Format<"date-time">;

  // Create JWT access token
  const access = jwt.sign(
    {
      id: created.id,
      email: created.email,
    },
    MyGlobal.env.JWT_SECRET_KEY,
    {
      expiresIn: "1h",
      issuer: "autobe",
    },
  );

  // Create JWT refresh token
  const refresh = jwt.sign(
    {
      id: created.id,
      tokenType: "refresh",
    },
    MyGlobal.env.JWT_SECRET_KEY,
    {
      expiresIn: "7d",
      issuer: "autobe",
    },
  );

  // Return the authorized member user information
  return {
    id: created.id,
    email: created.email,
    password_hash: created.password_hash,
    nickname: created.nickname,
    full_name: created.full_name,
    phone_number: created.phone_number,
    status: created.status,
    created_at: toISOStringSafe(created.created_at),
    updated_at: toISOStringSafe(created.updated_at),
    deleted_at: created.deleted_at ? toISOStringSafe(created.deleted_at) : null,
    token: {
      access,
      refresh,
      expired_at: accessExpiredAt,
      refreshable_until: refreshableUntil,
    },
  };
}
