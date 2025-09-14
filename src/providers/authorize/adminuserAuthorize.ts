import { ForbiddenException } from "@nestjs/common";

import { MyGlobal } from "../../MyGlobal";
import { jwtAuthorize } from "./jwtAuthorize";
import { AdminuserPayload } from "../../decorators/payload/AdminuserPayload";

export async function adminuserAuthorize(request: { headers: { authorization?: string } }): Promise<AdminuserPayload> {
  const payload: AdminuserPayload = jwtAuthorize({ request }) as AdminuserPayload;

  if (payload.type !== "adminuser") {
    throw new ForbiddenException(`You're not ${payload.type}`);
  }

  const adminuser = await MyGlobal.prisma.shopping_mall_adminusers.findFirst({
    where: {
      id: payload.id,
      deleted_at: null,
      status: "active"
    }
  });

  if (adminuser === null) {
    throw new ForbiddenException("You're not enrolled or inactive");
  }

  return payload;
}
