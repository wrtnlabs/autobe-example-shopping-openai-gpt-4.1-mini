import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSellerResponse } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerResponse";
import { IPageIShoppingMallSellerResponse } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallSellerResponse";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * List seller responses with filtering options.
 *
 * This endpoint returns a paginated list of seller response records including
 * filters for response content, privacy flag, and status. Access is restricted
 * to admin users.
 *
 * @param props - Object containing the authenticated adminUser and filter
 *   criteria
 * @param props.adminUser - The authenticated admin user payload
 * @param props.body - Filter and pagination criteria for seller responses
 * @returns A paginated list of seller response entities
 * @throws {Error} When underlying database queries fail or invalid params are
 *   provided
 */
export async function patch__shoppingMall_adminUser_sellerResponses(props: {
  adminUser: AdminuserPayload;
  body: IShoppingMallSellerResponse.IRequest;
}): Promise<IPageIShoppingMallSellerResponse> {
  const { adminUser, body } = props;

  // Set default paging values if null or undefined
  const page = body.page ?? 0;
  const limit = body.limit ?? 10;

  // Build Prisma where filter with null checks for nullable and optional properties
  const where = {
    deleted_at: null,
    ...(body.search !== undefined &&
      body.search !== null && {
        response_body: { contains: body.search },
      }),
    ...(body.is_private !== undefined &&
      body.is_private !== null && {
        is_private: body.is_private,
      }),
    ...(body.status !== undefined &&
      body.status !== null && {
        status: body.status,
      }),
  };

  // Perform concurrent queries for data and count
  const [results, total] = await Promise.all([
    MyGlobal.prisma.shopping_mall_seller_responses.findMany({
      where,
      orderBy: { created_at: "desc" },
      skip: page * limit,
      take: limit,
    }),
    MyGlobal.prisma.shopping_mall_seller_responses.count({ where }),
  ]);

  // Map results converting Date objects to ISO string format
  return {
    pagination: {
      current: Number(page),
      limit: Number(limit),
      records: total,
      pages: Math.ceil(total / limit),
    },
    data: results.map((item) => ({
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
