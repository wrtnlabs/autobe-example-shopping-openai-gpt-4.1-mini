import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSellerResponse } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerResponse";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

/**
 * Get details of a specific seller response.
 *
 * This endpoint retrieves detailed information of a seller response identified
 * by id. Includes response content, author identification, privacy settings,
 * status, and metadata. Only the seller user who owns the response can access
 * the data.
 *
 * @param props - Object containing the authenticated sellerUser and the seller
 *   response ID
 * @param props.sellerUser - The authenticated seller user making the request
 * @param props.id - Unique identifier of the seller response being requested
 * @returns Detailed seller response data conforming to
 *   IShoppingMallSellerResponse
 * @throws {Error} When the seller response is not found
 * @throws {Error} When the authenticated seller user does not own the response
 */
export async function get__shoppingMall_sellerUser_sellerResponses_$id(props: {
  sellerUser: SelleruserPayload;
  id: string & tags.Format<"uuid">;
}): Promise<IShoppingMallSellerResponse> {
  const { sellerUser, id } = props;

  const record =
    await MyGlobal.prisma.shopping_mall_seller_responses.findUnique({
      where: { id },
    });

  if (!record) throw new Error("Seller response not found");

  if (record.shopping_mall_selleruserid !== sellerUser.id) {
    throw new Error("Unauthorized access to seller response");
  }

  return {
    id: record.id,
    shopping_mall_inquiry_id: record.shopping_mall_inquiry_id ?? null,
    shopping_mall_review_id: record.shopping_mall_review_id ?? null,
    shopping_mall_selleruserid: record.shopping_mall_selleruserid,
    response_body: record.response_body,
    is_private: record.is_private,
    status: record.status,
    created_at: toISOStringSafe(record.created_at),
    updated_at: toISOStringSafe(record.updated_at),
    deleted_at: record.deleted_at ? toISOStringSafe(record.deleted_at) : null,
  };
}
