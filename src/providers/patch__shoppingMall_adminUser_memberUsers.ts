import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";
import { IPageIShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallMemberUser";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

export async function patch__shoppingMall_adminUser_memberUsers(props: {
  adminUser: AdminuserPayload;
  body: IShoppingMallMemberUser.IRequest;
}): Promise<IPageIShoppingMallMemberUser.ISummary> {
  const { body } = props;
  const page = body.page ?? 1;
  const limit = body.limit ?? 10;

  const where = {
    deleted_at: null,
    ...(body.email !== undefined &&
      body.email !== null && { email: { contains: body.email } }),
    ...(body.nickname !== undefined &&
      body.nickname !== null && { nickname: { contains: body.nickname } }),
    ...(body.status !== undefined &&
      body.status !== null && { status: body.status }),
    ...(body.created_at !== undefined &&
      body.created_at !== null && { created_at: body.created_at }),
    ...(body.updated_at !== undefined &&
      body.updated_at !== null && { updated_at: body.updated_at }),
  };

  const [results, total] = await Promise.all([
    MyGlobal.prisma.shopping_mall_memberusers.findMany({
      where,
      orderBy:
        body.orderBy &&
        (body.orderBy === "email" ||
          body.orderBy === "nickname" ||
          body.orderBy === "status" ||
          body.orderBy === "created_at" ||
          body.orderBy === "updated_at")
          ? { [body.orderBy]: body.direction === "asc" ? "asc" : "desc" }
          : { created_at: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        email: true,
        nickname: true,
        full_name: true,
        status: true,
        created_at: true,
      },
    }),
    MyGlobal.prisma.shopping_mall_memberusers.count({ where }),
  ]);

  return {
    pagination: {
      current: Number(page),
      limit: Number(limit),
      records: total,
      pages: Math.max(1, Math.ceil(total / limit)),
    },
    data: results.map((item) => ({
      id: item.id,
      email: item.email,
      nickname: item.nickname,
      full_name: item.full_name,
      status: item.status,
      created_at: toISOStringSafe(item.created_at),
    })),
  };
}
