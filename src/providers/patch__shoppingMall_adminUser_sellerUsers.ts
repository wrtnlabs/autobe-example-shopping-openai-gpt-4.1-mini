import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";
import { IPageIShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallSellerUser";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

export async function patch__shoppingMall_adminUser_sellerUsers(props: {
  adminUser: AdminuserPayload;
  body: IShoppingMallSellerUser.IRequest;
}): Promise<IPageIShoppingMallSellerUser.ISummary> {
  const { adminUser, body } = props;

  const page = body.page ?? 1;
  const limit = body.limit ?? 10;

  const where = {
    deleted_at: null,
    ...(body.status !== undefined &&
      body.status !== null && { status: body.status }),
    ...(body.search !== undefined &&
      body.search !== null && {
        OR: [
          { email: { contains: body.search } },
          { nickname: { contains: body.search } },
          { full_name: { contains: body.search } },
          { business_registration_number: { contains: body.search } },
        ],
      }),
  };

  const validSortFields = new Set([
    "email",
    "nickname",
    "full_name",
    "status",
    "business_registration_number",
    "created_at",
  ]);

  const sortField = validSortFields.has(body.sort ?? "")
    ? body.sort!
    : "created_at";

  const results = await MyGlobal.prisma.shopping_mall_sellerusers.findMany({
    where,
    orderBy: { [sortField]: "desc" },
    skip: (page - 1) * limit,
    take: limit,
    select: {
      id: true,
      email: true,
      nickname: true,
      full_name: true,
      status: true,
      business_registration_number: true,
      created_at: true,
    },
  });

  const total = await MyGlobal.prisma.shopping_mall_sellerusers.count({
    where,
  });

  return {
    pagination: {
      current: Number(page),
      limit: Number(limit),
      records: total,
      pages: Math.ceil(total / limit),
    },
    data: results.map((seller) => ({
      id: seller.id,
      email: seller.email,
      nickname: seller.nickname,
      full_name: seller.full_name,
      status: seller.status,
      business_registration_number: seller.business_registration_number,
      created_at: toISOStringSafe(seller.created_at),
    })),
  };
}
