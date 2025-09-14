import { ForbiddenException } from "@nestjs/common";

import { MyGlobal } from "../../MyGlobal";
import { jwtAuthorize } from "./jwtAuthorize";
import { SelleruserPayload } from "../../decorators/payload/SelleruserPayload";

export async function selleruserAuthorize(request: {
  headers: {
    authorization?: string;
  };
}): Promise<SelleruserPayload> {
  const payload: SelleruserPayload = jwtAuthorize({ request }) as SelleruserPayload;

  if (payload.type !== "sellerUser") {
    throw new ForbiddenException(`You're not ${payload.type}`);
  }

  // payload.id contains top-level user table ID
  // Since selleruser is standalone, we use id field directly
  const selleruser = await MyGlobal.prisma.shopping_mall_sellerusers.findFirst({
    where: {
      id: payload.id,
      deleted_at: null,
      status: "active"
    },
  });

  if (selleruser === null) {
    throw new ForbiddenException("You're not enrolled");
  }

  return payload;
}
