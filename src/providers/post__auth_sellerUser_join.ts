import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

/**
 * Registers a new seller user account and returns authorized credentials.
 *
 * This public endpoint performs:
 *
 * - Duplicate email and business_registration_number checks excluding
 *   soft-deleted accounts.
 * - Password hashing using MyGlobal.password.
 * - Seller status setting to "pending" upon registration.
 * - JWT access and refresh token generation with issuer "autobe" and proper
 *   expiry.
 *
 * @param props - Contains sellerUser (authenticated but unused) and body for
 *   creation
 * @returns Authorized seller user object with JWT tokens and profiles.
 * @throws {Error} When email or business_registration_number duplicates exist
 */
export async function post__auth_sellerUser_join(props: {
  sellerUser: SelleruserPayload;
  body: IShoppingMallSellerUser.ICreate;
}): Promise<IShoppingMallSellerUser.IAuthorized> {
  const { body } = props;

  const emailCount = await MyGlobal.prisma.shopping_mall_sellerusers.count({
    where: { email: body.email, deleted_at: null },
  });
  if (emailCount > 0) throw new Error("Duplicate email");

  const brnCount = await MyGlobal.prisma.shopping_mall_sellerusers.count({
    where: {
      business_registration_number: body.business_registration_number,
      deleted_at: null,
    },
  });
  if (brnCount > 0) throw new Error("Duplicate business_registration_number");

  const now = toISOStringSafe(new Date());
  const id = v4() as string & tags.Format<"uuid">;

  const password_hash = await MyGlobal.password.hash(body.password);

  const created = await MyGlobal.prisma.shopping_mall_sellerusers.create({
    data: {
      id,
      email: body.email,
      password_hash,
      nickname: body.nickname,
      full_name: body.full_name,
      phone_number: body.phone_number ?? null,
      status: "pending",
      business_registration_number: body.business_registration_number,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    },
  });

  const currentTimeMs = Date.now();
  const accessExpMs = currentTimeMs + 3600000; // 1 hour
  const refreshExpMs = currentTimeMs + 604800000; // 7 days

  const accessExpISOString = new Date(accessExpMs).toISOString() as string &
    tags.Format<"date-time">;
  const refreshExpISOString = new Date(refreshExpMs).toISOString() as string &
    tags.Format<"date-time">;

  const accessToken = jwt.sign(
    {
      userId: created.id,
      email: created.email,
      type: "sellerUser",
    },
    MyGlobal.env.JWT_SECRET_KEY,
    {
      expiresIn: "1h",
      issuer: "autobe",
    },
  );

  const refreshToken = jwt.sign(
    {
      userId: created.id,
      tokenType: "refresh",
    },
    MyGlobal.env.JWT_SECRET_KEY,
    {
      expiresIn: "7d",
      issuer: "autobe",
    },
  );

  return {
    id: created.id,
    email: created.email,
    password_hash: created.password_hash,
    nickname: created.nickname,
    full_name: created.full_name,
    phone_number: created.phone_number ?? null,
    status: created.status,
    business_registration_number: created.business_registration_number,
    created_at: toISOStringSafe(created.created_at),
    updated_at: toISOStringSafe(created.updated_at),
    deleted_at: created.deleted_at ? toISOStringSafe(created.deleted_at) : null,
    accessToken,
    refreshToken,
    token: {
      access: accessToken,
      refresh: refreshToken,
      expired_at: accessExpISOString,
      refreshable_until: refreshExpISOString,
    },
  };
}
