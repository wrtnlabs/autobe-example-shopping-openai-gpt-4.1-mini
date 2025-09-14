import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSellerResponse } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerResponse";
import { IPageIShoppingMallSellerResponse } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallSellerResponse";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

export async function patch__shoppingMall_sellerUser_sellerResponses(props: {
  sellerUser: SelleruserPayload;
  body: IShoppingMallSellerResponse.IRequest;
}): Promise<IPageIShoppingMallSellerResponse> {
  const { sellerUser, body } = props;

  const page = body.page ?? 1;
  const limit = body.limit ?? 10;

  const where = {
    shopping_mall_selleruserid: sellerUser.id,
    deleted_at: null,
    ...(body.is_private !== undefined &&
      body.is_private !== null && { is_private: body.is_private }),
    ...(body.status !== undefined &&
      body.status !== null && { status: body.status }),
    ...(body.search !== undefined &&
      body.search !== null && { response_body: { contains: body.search } }),
  };

  const [data, total] = await Promise.all([
    MyGlobal.prisma.shopping_mall_seller_responses.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    MyGlobal.prisma.shopping_mall_seller_responses.count({ where }),
  ]);

  return {
    pagination: {
      current: Number(page),
      limit: Number(limit),
      records: total,
      pages: Math.ceil(total / limit),
    },
    data: data.map((item) => ({
      id: item.id,
      shopping_mall_inquiry_id: item.shopping_mall_inquiry_id ?? null,
      shopping_mall_review_id: item.shopping_mall_review_id ?? null,
      shopping_mall_selleruserid: item.shopping_mall_selleruserid,
      response_body: item.response_body,
      is_private: item.is_private,
      status: item.status,
      created_at: toISOStringSafe(item.created_at),
      updated_at: toISOStringSafe(item.updated_at),
      deleted_at: item.deleted_at ? toISOStringSafe(item.deleted_at) : null,
    })),
  };
}
