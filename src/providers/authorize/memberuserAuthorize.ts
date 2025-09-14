import { ForbiddenException } from "@nestjs/common";

import { MyGlobal } from "../../MyGlobal";
import { jwtAuthorize } from "./jwtAuthorize";
import { MemberuserPayload } from "../../decorators/payload/MemberuserPayload";

export async function memberuserAuthorize(request: {
  headers: {
    authorization?: string;
  };
}): Promise<MemberuserPayload> {
  const payload: MemberuserPayload = jwtAuthorize({ request }) as MemberuserPayload;

  if (payload.type !== "memberuser") {
    throw new ForbiddenException(`You're not ${payload.type}`);
  }

  // payload.id contains top-level user table ID
  // Query using appropriate field based on schema structure
  const memberuser = await MyGlobal.prisma.shopping_mall_memberusers.findFirst({
    where: {
      id: payload.id,
      deleted_at: null,
      status: "active"
    },
  });

  if (memberuser === null) {
    throw new ForbiddenException("You're not enrolled");
  }

  return payload;
}
