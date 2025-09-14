import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallCarts } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCarts";
import { IPageIShoppingMallCarts } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallCarts";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

export async function patch__shoppingMall_memberUser_carts(props: {
  memberUser: MemberuserPayload;
  body: IShoppingMallCarts.IRequest;
}): Promise<IPageIShoppingMallCarts.ISummary> {
  const { memberUser, body } = props;

  const member_user_id = memberUser.id;

  const where = {
    deleted_at: null,
    member_user_id,
    ...(body.status !== undefined &&
      body.status !== null && {
        status: body.status,
      }),
    ...(body.guest_user_id !== undefined &&
      body.guest_user_id !== null && {
        guest_user_id: body.guest_user_id,
      }),
  };

  const page = body.page && body.page > 0 ? body.page : 1;
  const limit = body.limit && body.limit > 0 ? body.limit : 20;
  const skip = (page - 1) * limit;

  const orderBy =
    typeof body.orderBy === "string" && body.orderBy.trim().length > 0
      ? (() => {
          const [field, direction] = body.orderBy.trim().split(/\s+/);
          if (
            [
              "created_at",
              "updated_at",
              "status",
              "guest_user_id",
              "member_user_id",
            ].includes(field)
          ) {
            return {
              [field]: (direction === "desc"
                ? "desc"
                : "asc") as Prisma.SortOrder,
            };
          }
          return { created_at: "desc" as Prisma.SortOrder };
        })()
      : { created_at: "desc" as Prisma.SortOrder };

  const [results, total] = await Promise.all([
    MyGlobal.prisma.shopping_mall_carts.findMany({
      where,
      orderBy,
      skip,
      take: limit,
      select: {
        id: true,
        guest_user_id: true,
        member_user_id: true,
        created_at: true,
        updated_at: true,
        status: true,
      },
    }),
    MyGlobal.prisma.shopping_mall_carts.count({ where }),
  ]);

  return {
    pagination: {
      current: Number(page),
      limit: Number(limit),
      records: total,
      pages: Math.ceil(total / limit),
    },
    data: results.map((item) => ({
      id: item.id,
      guest_user_id: item.guest_user_id ?? null,
      member_user_id: item.member_user_id ?? null,
      created_at: toISOStringSafe(item.created_at),
      updated_at: toISOStringSafe(item.updated_at),
      status: item.status,
    })),
  };
}
