import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSellerResponse } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerResponse";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Create new seller response
 *
 * Creates a new seller response entry linked to a customer inquiry or review.
 * Requires admin user authentication.
 *
 * @param props - Object containing adminUser and request body
 * @param props.adminUser - Authenticated admin user
 * @param props.body - Request body with seller response data
 * @returns The created seller response details
 * @throws Error if creation fails
 */
export async function post__shoppingMall_adminUser_sellerResponses(props: {
  adminUser: AdminuserPayload;
  body: IShoppingMallSellerResponse.ICreate;
}): Promise<IShoppingMallSellerResponse> {
  const { body } = props;

  const now = toISOStringSafe(new Date());
  const id = v4() as string & tags.Format<"uuid">;

  const created = await MyGlobal.prisma.shopping_mall_seller_responses.create({
    data: {
      id,
      shopping_mall_inquiry_id: body.shopping_mall_inquiry_id ?? null,
      shopping_mall_review_id: body.shopping_mall_review_id ?? null,
      shopping_mall_selleruserid: body.shopping_mall_selleruserid,
      response_body: body.response_body,
      is_private: body.is_private,
      status: body.status,
      created_at: now,
      updated_at: now,
    },
  });

  return {
    id: created.id,
    shopping_mall_inquiry_id: created.shopping_mall_inquiry_id ?? null,
    shopping_mall_review_id: created.shopping_mall_review_id ?? null,
    shopping_mall_selleruserid: created.shopping_mall_selleruserid,
    response_body: created.response_body,
    is_private: created.is_private,
    status: created.status,
    created_at: toISOStringSafe(created.created_at),
    updated_at: toISOStringSafe(created.updated_at),
    deleted_at: created.deleted_at ? toISOStringSafe(created.deleted_at) : null,
  };
}
