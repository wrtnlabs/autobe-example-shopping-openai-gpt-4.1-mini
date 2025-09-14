import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallReview } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallReview";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Update a product review by ID.
 *
 * Allows rating and content modifications.
 *
 * Requires authorization: the authenticated member user must be the owner of
 * the review to perform the update.
 *
 * @param props - Object containing the authenticated member user, the review ID
 *   to update, and the updated review data.
 * @param props.memberUser - The authenticated member user performing the
 *   update.
 * @param props.id - The UUID of the product review to be updated.
 * @param props.body - The updated product review data.
 * @returns The updated product review data conforming to IShoppingMallReview.
 * @throws {Error} When the review is not found.
 * @throws {Error} When the authenticated user is not authorized to update the
 *   review.
 */
export async function put__shoppingMall_memberUser_reviews_$id(props: {
  memberUser: MemberuserPayload;
  id: string & tags.Format<"uuid">;
  body: IShoppingMallReview.IUpdate;
}): Promise<IShoppingMallReview> {
  const { memberUser, id, body } = props;

  const existingReview =
    await MyGlobal.prisma.shopping_mall_reviews.findUniqueOrThrow({
      where: { id },
    });

  if (existingReview.shopping_mall_memberuserid !== memberUser.id) {
    throw new Error("Unauthorized");
  }

  const updated = await MyGlobal.prisma.shopping_mall_reviews.update({
    where: { id },
    data: {
      shopping_mall_channel_id: body.shopping_mall_channel_id ?? undefined,
      shopping_mall_category_id: body.shopping_mall_category_id ?? undefined,
      shopping_mall_memberuserid: body.shopping_mall_memberuserid ?? undefined,
      shopping_mall_sale_snapshot_id:
        body.shopping_mall_sale_snapshot_id ?? undefined,
      review_title: body.review_title ?? undefined,
      review_body: body.review_body ?? undefined,
      rating: body.rating ?? undefined,
      is_private: body.is_private ?? undefined,
      status: body.status ?? undefined,
      deleted_at: body.deleted_at ?? undefined,
      updated_at: toISOStringSafe(new Date()),
    },
  });

  return {
    id: updated.id,
    shopping_mall_channel_id: updated.shopping_mall_channel_id,
    shopping_mall_category_id: updated.shopping_mall_category_id ?? null,
    shopping_mall_memberuserid: updated.shopping_mall_memberuserid,
    shopping_mall_sale_snapshot_id: updated.shopping_mall_sale_snapshot_id,
    review_title: updated.review_title,
    review_body: updated.review_body,
    rating: updated.rating,
    is_private: updated.is_private,
    status: updated.status,
    created_at: toISOStringSafe(updated.created_at),
    updated_at: toISOStringSafe(updated.updated_at),
    deleted_at: updated.deleted_at ? toISOStringSafe(updated.deleted_at) : null,
  };
}
