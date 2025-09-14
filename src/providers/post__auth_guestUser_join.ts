import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallGuestUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallGuestUser";
import { GuestuserPayload } from "../decorators/payload/GuestuserPayload";

/**
 * Creates a temporary guest user account and issues access tokens.
 *
 * This function handles the creation of a guest user session without
 * credentials. It stores all relevant session info and securely generates JWT
 * access and refresh tokens scoped for guest user access.
 *
 * @param props - Object containing guestUser payload and join request body.
 * @param props.guestUser - The payload of guest user (not used in logic).
 * @param props.body - The guest join request containing session data.
 * @returns The guest user authorization data including JWT tokens.
 * @throws {Error} Throws if database creation fails.
 */
export async function post__auth_guestUser_join(props: {
  guestUser: GuestuserPayload;
  body: IShoppingMallGuestUser.IJoin;
}): Promise<IShoppingMallGuestUser.IAuthorized> {
  const now = toISOStringSafe(new Date());
  const newId = v4();

  const created = await MyGlobal.prisma.shopping_mall_guestusers.create({
    data: {
      id: newId,
      ip_address: props.body.ip_address,
      access_url: props.body.access_url,
      referrer: props.body.referrer ?? null,
      user_agent: props.body.user_agent ?? null,
      session_start_at: now,
      session_end_at: null,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    },
  });

  const accessToken = jwt.sign(
    {
      id: created.id,
      type: "guestuser",
    },
    MyGlobal.env.JWT_SECRET_KEY,
    {
      expiresIn: "1h",
      issuer: "autobe",
    },
  );

  const refreshToken = jwt.sign(
    {
      id: created.id,
      type: "guestuser",
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
    ip_address: created.ip_address,
    access_url: created.access_url,
    referrer: created.referrer,
    user_agent: created.user_agent,
    session_start_at: now,
    session_end_at: null,
    created_at: now,
    updated_at: now,
    deleted_at: null,
    token: {
      access: accessToken,
      refresh: refreshToken,
      expired_at: toISOStringSafe(new Date(Date.now() + 3600000)),
      refreshable_until: toISOStringSafe(new Date(Date.now() + 604800000)),
    },
  };
}
