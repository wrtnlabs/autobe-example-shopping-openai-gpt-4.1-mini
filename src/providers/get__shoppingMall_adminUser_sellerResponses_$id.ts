import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSellerResponse } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerResponse";
import { AdminuserPayload } from "../decorators/payload/AdminuserPayload";

/**
 * Retrieves detailed information of a seller response identified by its UUID.
 *
 * This endpoint returns the seller response content, author user ID, linked
 * inquiry or review IDs (nullable), privacy status, response status, and
 * timestamps. Access requires the authenticated admin user.
 *
 * @param props - Object containing authentication and seller response ID
 * @param props.adminUser - Authenticated admin user payload
 * @param props.id - UUID of the seller response to retrieve
 * @returns Detailed seller response data conforming to
 *   IShoppingMallSellerResponse
 * @throws {Error} When the seller response does not exist or is soft deleted
 */
export async function get__shoppingMall_adminUser_sellerResponses_$id(props: {
  adminUser: AdminuserPayload;
  id: string & tags.Format<"uuid">;
}): Promise<IShoppingMallSellerResponse> {
  const { adminUser, id } = props;

  const sellerResponse =
    await MyGlobal.prisma.shopping_mall_seller_responses.findFirst({
      where: {
        id,
        deleted_at: null,
      },
    });

  if (!sellerResponse) {
    throw new Error("Seller Response not found");
  }

  return {
    id: sellerResponse.id,
    shopping_mall_inquiry_id: sellerResponse.shopping_mall_inquiry_id ?? null,
    shopping_mall_review_id: sellerResponse.shopping_mall_review_id ?? null,
    shopping_mall_selleruserid: sellerResponse.shopping_mall_selleruserid,
    response_body: sellerResponse.response_body,
    is_private: sellerResponse.is_private,
    status: sellerResponse.status,
    created_at: toISOStringSafe(sellerResponse.created_at),
    updated_at: toISOStringSafe(sellerResponse.updated_at),
    deleted_at: sellerResponse.deleted_at
      ? toISOStringSafe(sellerResponse.deleted_at)
      : null,
  };
}
