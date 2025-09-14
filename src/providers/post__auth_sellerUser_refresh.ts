import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

/**
 * Refresh JWT tokens for seller users with valid refresh token.
 *
 * This API endpoint enables seller users to renew their JWT access tokens by
 * providing a valid refresh token. It validates the token against issued
 * records and expiration constraints in the system tied to the
 * shopping_mall_sellerusers role. Upon validation, new access and refresh
 * tokens are generated and returned within the
 * IShoppingMallSellerUser.IAuthorized response format.
 *
 * @param props - Object containing the authenticated sellerUser and refresh
 *   token body
 * @param props.sellerUser - The authenticated seller user making the request
 * @param props.body - Request body containing the refresh token
 * @returns A promise resolving to the authorized seller user with new tokens
 * @throws {Error} Throws error if refresh token is invalid or seller user is
 *   not valid or active
 */
export async function post__auth_sellerUser_refresh(props: {
  sellerUser: SelleruserPayload;
  body: IShoppingMallSellerUser.IRefresh;
}): Promise<IShoppingMallSellerUser.IAuthorized> {
  const { body } = props;
  let decoded: unknown;

  try {
    decoded = jwt.verify(body.refreshToken, MyGlobal.env.JWT_SECRET_KEY, {
      issuer: "autobe",
    });
  } catch {
    throw new Error("Invalid refresh token");
  }

  if (typeof decoded !== "object" || decoded === null || !("id" in decoded)) {
    throw new Error("Invalid refresh token payload");
  }

  const sellerUser = await MyGlobal.prisma.shopping_mall_sellerusers.findUnique(
    {
      where: { id: (decoded as { id: string }).id },
    },
  );

  if (
    !sellerUser ||
    sellerUser.deleted_at !== null ||
    sellerUser.status !== "active"
  ) {
    throw new Error("Invalid seller user");
  }

  const accessToken = jwt.sign(
    {
      id: sellerUser.id,
      email: sellerUser.email,
      nickname: sellerUser.nickname,
      full_name: sellerUser.full_name,
      phone_number: sellerUser.phone_number ?? null,
      status: sellerUser.status,
      business_registration_number: sellerUser.business_registration_number,
      created_at: toISOStringSafe(sellerUser.created_at),
      updated_at: toISOStringSafe(sellerUser.updated_at),
      deleted_at: sellerUser.deleted_at
        ? toISOStringSafe(sellerUser.deleted_at)
        : null,
    },
    MyGlobal.env.JWT_SECRET_KEY,
    {
      expiresIn: "1h",
      issuer: "autobe",
    },
  );

  const refreshToken = jwt.sign(
    {
      id: sellerUser.id,
      tokenType: "refresh",
    },
    MyGlobal.env.JWT_SECRET_KEY,
    {
      expiresIn: "7d",
      issuer: "autobe",
    },
  );

  const expiredAt: string & tags.Format<"date-time"> = toISOStringSafe(
    new Date(Date.now() + 3600 * 1000),
  );
  const refreshableUntil: string & tags.Format<"date-time"> = toISOStringSafe(
    new Date(Date.now() + 7 * 24 * 3600 * 1000),
  );

  return {
    id: sellerUser.id,
    email: sellerUser.email as string & tags.Format<"email">,
    password_hash: sellerUser.password_hash,
    nickname: sellerUser.nickname,
    full_name: sellerUser.full_name,
    phone_number: sellerUser.phone_number ?? null,
    status: sellerUser.status,
    business_registration_number: sellerUser.business_registration_number,
    created_at: toISOStringSafe(sellerUser.created_at),
    updated_at: toISOStringSafe(sellerUser.updated_at),
    deleted_at: sellerUser.deleted_at
      ? toISOStringSafe(sellerUser.deleted_at)
      : null,
    accessToken: accessToken,
    refreshToken: refreshToken,
    token: {
      access: accessToken,
      refresh: refreshToken,
      expired_at: expiredAt,
      refreshable_until: refreshableUntil,
    },
  };
}
