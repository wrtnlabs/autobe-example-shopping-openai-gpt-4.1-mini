import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallChannel } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallChannel";
import { IPageIShoppingMallChannel } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallChannel";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

export async function patch__shoppingMall_adminUser_channels(props: {
  adminUser: AdminuserPayload;
  body: IShoppingMallChannel.IRequest;
}): Promise<IPageIShoppingMallChannel.ISummary> {
  const { adminUser, body } = props;

  const page = Number(body.page ?? 1);
  const limit = Number(body.limit ?? 10);
  const search = body.search ?? null;
  const status = body.status ?? null;
  const sortBy = body.sortBy ?? "created_at";
  const order = body.order ?? "desc";

  const where = {
    deleted_at: null,
    ...(status !== undefined && status !== null && { status }),
    ...(search !== undefined &&
      search !== null && {
        OR: [
          { code: { contains: search } },
          { name: { contains: search } },
          { description: { contains: search } },
        ],
      }),
  };

  const allowedSortFields = ["id", "code", "name", "status", "created_at"];

  const orderBy = ((): { [key: string]: "asc" | "desc" } => {
    if (allowedSortFields.includes(sortBy)) {
      return { [sortBy]: order === "asc" ? "asc" : "desc" };
    }
    return { created_at: "desc" };
  })();

  const [channels, total] = await Promise.all([
    MyGlobal.prisma.shopping_mall_channels.findMany({
      where,
      orderBy,
      skip: (page - 1) * limit,
      take: limit,
      select: {
        id: true,
        code: true,
        name: true,
        description: true,
        status: true,
        created_at: true,
      },
    }),
    MyGlobal.prisma.shopping_mall_channels.count({ where }),
  ]);

  return {
    pagination: {
      current: Number(page),
      limit: Number(limit),
      records: total,
      pages: Math.ceil(total / limit),
    },
    data: channels.map((channel) => ({
      id: channel.id,
      code: channel.code,
      name: channel.name,
      description: channel.description ?? null,
      status: channel.status,
      created_at: toISOStringSafe(channel.created_at),
    })),
  };
}
