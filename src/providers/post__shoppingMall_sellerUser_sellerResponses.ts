import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSellerResponse } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerResponse";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

/**
 * Creates a new seller response record linked to a customer inquiry or review.
 *
 * This operation stores the response content, privacy flags, status, author
 * seller user ID, and optionally linked inquiry or review IDs in the
 * shopping_mall_seller_responses table.
 *
 * Only authorized sellers and administrators can perform this operation.
 *
 * @param props - The operation input containing seller user payload and
 *   response creation data
 * @param props.sellerUser - The authenticated seller user performing the action
 * @param props.body - The new seller response data
 * @returns The newly created seller response record with all fields populated
 * @throws {Error} If the database operation fails
 */
export async function post__shoppingMall_sellerUser_sellerResponses(props: {
  sellerUser: SelleruserPayload;
  body: IShoppingMallSellerResponse.ICreate;
}): Promise<IShoppingMallSellerResponse> {
  const now = toISOStringSafe(new Date());
  const id = v4() as string & tags.Format<"uuid">;

  const created = await MyGlobal.prisma.shopping_mall_seller_responses.create({
    data: {
      id: id,
      shopping_mall_inquiry_id: props.body.shopping_mall_inquiry_id ?? null,
      shopping_mall_review_id: props.body.shopping_mall_review_id ?? null,
      shopping_mall_selleruserid: props.body.shopping_mall_selleruserid,
      response_body: props.body.response_body,
      is_private: props.body.is_private,
      status: props.body.status,
      created_at: now,
      updated_at: now,
      deleted_at: null,
    },
  });

  return {
    id: created.id as string & tags.Format<"uuid">,
    shopping_mall_inquiry_id: created.shopping_mall_inquiry_id ?? null,
    shopping_mall_review_id: created.shopping_mall_review_id ?? null,
    shopping_mall_selleruserid: created.shopping_mall_selleruserid as string &
      tags.Format<"uuid">,
    response_body: created.response_body,
    is_private: created.is_private,
    status: created.status,
    created_at: toISOStringSafe(created.created_at),
    updated_at: toISOStringSafe(created.updated_at),
    deleted_at: created.deleted_at ? toISOStringSafe(created.deleted_at) : null,
  };
}
