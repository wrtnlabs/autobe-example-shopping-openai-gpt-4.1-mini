import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallSellerResponse } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerResponse";
import { SelleruserPayload } from "../decorators/payload/SelleruserPayload";

/**
 * Update a seller response by ID.
 *
 * This operation updates an existing seller response record in the shopping
 * mall backend. It checks that the authenticated seller is the owner of the
 * response, then updates the specified fields including response content,
 * privacy, status, and deletion timestamp. The timestamps are managed properly
 * with conversion to ISO strings.
 *
 * @param props - Object containing the sellerUser payload, the ID of the seller
 *   response to update, and the update data (partial).
 * @returns The updated seller response entity.
 * @throws {Error} Throws if the seller user is unauthorized to update the
 *   response.
 * @throws {Prisma.PrismaClientKnownRequestError} Throws if seller response does
 *   not exist.
 */
export async function put__shoppingMall_sellerUser_sellerResponses_$id(props: {
  sellerUser: SelleruserPayload;
  id: string & tags.Format<"uuid">;
  body: IShoppingMallSellerResponse.IUpdate;
}): Promise<IShoppingMallSellerResponse> {
  const { sellerUser, id, body } = props;

  // Fetch the existing seller response to verify ownership
  const existing =
    await MyGlobal.prisma.shopping_mall_seller_responses.findUniqueOrThrow({
      where: { id },
    });

  // Verify that the requesting seller is the owner
  if (existing.shopping_mall_selleruserid !== sellerUser.id) {
    throw new Error(
      "Unauthorized: Only the owner seller can update this response",
    );
  }

  // Update record with only provided fields and update timestamp
  const updated = await MyGlobal.prisma.shopping_mall_seller_responses.update({
    where: { id },
    data: {
      shopping_mall_inquiry_id: body.shopping_mall_inquiry_id ?? undefined,
      shopping_mall_review_id: body.shopping_mall_review_id ?? undefined,
      shopping_mall_selleruserid: body.shopping_mall_selleruserid ?? undefined,
      response_body: body.response_body ?? undefined,
      is_private: body.is_private ?? undefined,
      status: body.status ?? undefined,
      deleted_at:
        body.deleted_at === null ? null : (body.deleted_at ?? undefined),
      updated_at: toISOStringSafe(new Date()),
    },
  });

  // Return updated record with date fields converted safely
  return {
    id: updated.id,
    shopping_mall_inquiry_id: updated.shopping_mall_inquiry_id ?? null,
    shopping_mall_review_id: updated.shopping_mall_review_id ?? null,
    shopping_mall_selleruserid: updated.shopping_mall_selleruserid,
    response_body: updated.response_body,
    is_private: updated.is_private,
    status: updated.status,
    created_at: toISOStringSafe(updated.created_at),
    updated_at: toISOStringSafe(updated.updated_at),
    deleted_at: updated.deleted_at ? toISOStringSafe(updated.deleted_at) : null,
  };
}
