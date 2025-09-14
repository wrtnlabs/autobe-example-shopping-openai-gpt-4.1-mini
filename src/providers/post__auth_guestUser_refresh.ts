import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallGuestUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallGuestUser";
import { GuestuserPayload } from "../decorators/payload/GuestuserPayload";

/**
 * Refresh temporary access tokens for guestUser role using valid refresh
 * tokens.
 *
 * This endpoint verifies the refresh token associated with a guest user
 * session, ensures the session is active, and issues new JWT access and refresh
 * tokens.
 *
 * It returns guest user session info alongside new tokens with updated
 * expiration.
 *
 * @param props - Object containing guestUser payload and request body with
 *   refresh token.
 * @param props.guestUser - The guest user payload extracted from authorization.
 * @param props.body - Request body containing the refresh token string.
 * @returns Updated guest user authorization data including new tokens.
 * @throws {Error} Throws if token verification fails or guest user session is
 *   not found.
 */
export async function post__auth_guestUser_refresh(props: {
  guestUser: GuestuserPayload;
  body: IShoppingMallGuestUser.IRefresh;
}): Promise<IShoppingMallGuestUser.IAuthorized> {
  const { guestUser, body } = props;

  // Verify and decode refresh token
  const decoded = jwt.verify(body.refresh_token, MyGlobal.env.JWT_SECRET_KEY, {
    issuer: "autobe",
  }) as { id: string & tags.Format<"uuid">; type: "guestuser" };

  // Fetch guest user session record
  const guest =
    await MyGlobal.prisma.shopping_mall_guestusers.findUniqueOrThrow({
      where: { id: decoded.id },
    });

  // Compute expiration and refreshable timestamps
  const now = Date.now();
  const expiredAt = toISOStringSafe(new Date(now + 3600 * 1000)); // 1 hour later
  const refreshableUntil = toISOStringSafe(
    new Date(now + 7 * 24 * 3600 * 1000),
  ); // 7 days later

  // Generate new access token
  const accessToken = jwt.sign(
    { id: guest.id, type: "guestuser" },
    MyGlobal.env.JWT_SECRET_KEY,
    { expiresIn: "1h", issuer: "autobe" },
  );

  // Generate new refresh token
  const refreshToken = jwt.sign(
    { id: guest.id, type: "guestuser" },
    MyGlobal.env.JWT_SECRET_KEY,
    { expiresIn: "7d", issuer: "autobe" },
  );

  // Compose token object
  const token: IShoppingMallGuestUser.IAuthorized["token"] = {
    access: accessToken,
    refresh: refreshToken,
    expired_at: expiredAt,
    refreshable_until: refreshableUntil,
  };

  return {
    id: guest.id,
    ip_address: guest.ip_address,
    access_url: guest.access_url,
    referrer: guest.referrer ?? null,
    user_agent: guest.user_agent ?? null,
    session_start_at: toISOStringSafe(guest.session_start_at),
    session_end_at: guest.session_end_at
      ? toISOStringSafe(guest.session_end_at)
      : null,
    created_at: toISOStringSafe(guest.created_at),
    updated_at: toISOStringSafe(guest.updated_at),
    deleted_at: guest.deleted_at ? toISOStringSafe(guest.deleted_at) : null,
    token,
  };
}
