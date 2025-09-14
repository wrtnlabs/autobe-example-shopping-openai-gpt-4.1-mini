import { ForbiddenException } from "@nestjs/common";

import { MyGlobal } from "../../MyGlobal";
import { jwtAuthorize } from "./jwtAuthorize";
import { GuestuserPayload } from "../../decorators/payload/GuestuserPayload";

export async function guestuserAuthorize(request: {
  headers: {
    authorization?: string;
  };
}): Promise<GuestuserPayload> {
  const payload: GuestuserPayload = jwtAuthorize({ request }) as GuestuserPayload;

  if (payload.type !== "guestuser") {
    throw new ForbiddenException(`You're not ${payload.type}`);
  }

  // payload.id contains top-level user table ID, which is shopping_mall_guestusers.id

  const guestuser = await MyGlobal.prisma.shopping_mall_guestusers.findFirst({
    where: {
      id: payload.id,
      deleted_at: null,
    },
  });

  if (guestuser === null) {
    throw new ForbiddenException("You're not enrolled");
  }

  return payload;
}
