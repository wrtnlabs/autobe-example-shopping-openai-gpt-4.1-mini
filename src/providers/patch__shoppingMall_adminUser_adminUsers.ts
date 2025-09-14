import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import { IPageIShoppingMallAdminuser } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallAdminuser";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

export async function patch__shoppingMall_adminUser_adminUsers(props: {
  adminUser: AdminuserPayload;
  body: IShoppingMallAdminUser.IRequest;
}): Promise<IPageIShoppingMallAdminuser> {
  const { adminUser, body } = props;
  const page = body.page ?? 1;
  const limit = body.limit ?? 10;

  const where = {
    deleted_at: null,
    ...(body.status !== undefined &&
      body.status !== null && { status: body.status }),
    ...(body.search !== undefined && body.search !== null
      ? {
          OR: [
            { email: { contains: body.search } },
            { nickname: { contains: body.search } },
            { full_name: { contains: body.search } },
          ],
        }
      : {}),
  };

  const orderBy =
    body.sort && body.sort.length >= 2
      ? ((): { [key: string]: "asc" | "desc" } => {
          const sortOrder =
            body.sort[0] === "+"
              ? "asc"
              : body.sort[0] === "-"
                ? "desc"
                : "desc";
          const sortField = body.sort.slice(1);
          const allowedFields = [
            "email",
            "nickname",
            "full_name",
            "status",
            "created_at",
            "updated_at",
          ];
          if (allowedFields.includes(sortField)) {
            return { [sortField]: sortOrder } as {
              [key: string]: "asc" | "desc";
            };
          }
          return { created_at: "desc" };
        })()
      : { created_at: "desc" as "desc" };

  const [users, total] = await Promise.all([
    MyGlobal.prisma.shopping_mall_adminusers.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
    }),
    MyGlobal.prisma.shopping_mall_adminusers.count({ where }),
  ]);

  return {
    pagination: {
      current: Number(page),
      limit: Number(limit),
      records: total,
      pages: Math.ceil(total / limit),
    },
    data: users.map((user) => ({
      id: user.id,
      email: user.email,
      password_hash: user.password_hash,
      nickname: user.nickname,
      full_name: user.full_name,
      status: user.status,
      created_at: toISOStringSafe(user.created_at),
      updated_at: toISOStringSafe(user.updated_at),
      deleted_at: user.deleted_at ? toISOStringSafe(user.deleted_at) : null,
    })),
  };
}
