import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallReview } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallReview";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Create a new product review by an authenticated member user.
 *
 * This function verifies the member user's recent purchase to ensure the
 * authenticity of the review. It associates the review with the related
 * channel, category (if available), and sale snapshot.
 *
 * Upon successful creation, it returns the full review details with all
 * timestamps converted to ISO 8601 format strings.
 *
 * @param props - Object containing the authenticated member user and the review
 *   input data
 * @param props.memberUser - The authenticated member user payload
 * @param props.body - The review creation data including rating, title, body,
 *   and privacy flag
 * @returns The newly created product review with all fields mapped and
 *   timestamps converted
 * @throws {Error} When no recent confirmed paid order is found for the member
 *   user
 * @throws {Error} When no order items are found for the recent order
 * @throws {Error} When the sale snapshot linked to the order item cannot be
 *   found
 */
export async function post__shoppingMall_memberUser_reviews(props: {
  memberUser: MemberuserPayload;
  body: IShoppingMallReview.ICreate;
}): Promise<IShoppingMallReview> {
  const { memberUser, body } = props;

  // Verify the member user has a recent confirmed and paid order
  const recentOrder = await MyGlobal.prisma.shopping_mall_orders.findFirst({
    where: {
      shopping_mall_memberuser_id: memberUser.id,
      order_status: "confirmed",
      payment_status: "paid",
    },
    orderBy: { created_at: "desc" },
  });

  if (!recentOrder) {
    throw new Error(
      "No recent confirmed order with payment found for member user.",
    );
  }

  // Find an order item linked with the order
  const orderItem = await MyGlobal.prisma.shopping_mall_order_items.findFirst({
    where: {
      shopping_mall_order_id: recentOrder.id,
    },
    orderBy: { created_at: "desc" },
  });

  if (!orderItem) {
    throw new Error("No order items found for the recent order.");
  }

  // Retrieve the sale snapshot to associate review
  const snapshot =
    await MyGlobal.prisma.shopping_mall_sale_snapshots.findUnique({
      where: { id: orderItem.shopping_mall_sale_snapshot_id },
    });

  if (!snapshot) {
    throw new Error("Sale snapshot not found for order item.");
  }

  // Create the review record with necessary references and default status 'pending'
  const now = toISOStringSafe(new Date());

  const newReview = await MyGlobal.prisma.shopping_mall_reviews.create({
    data: {
      id: v4(),
      shopping_mall_channel_id: recentOrder.shopping_mall_channel_id,
      shopping_mall_category_id: null, // Category unknown - set null
      shopping_mall_memberuserid: memberUser.id,
      shopping_mall_sale_snapshot_id: snapshot.id,
      review_title: body.review_title,
      review_body: body.review_body,
      rating: body.rating,
      is_private: body.is_private,
      status: "pending",
      created_at: now,
      updated_at: now,
      deleted_at: null,
    },
  });

  // Return the created review with date/time fields properly formatted
  return {
    id: newReview.id,
    shopping_mall_channel_id: newReview.shopping_mall_channel_id,
    shopping_mall_category_id: newReview.shopping_mall_category_id ?? null,
    shopping_mall_memberuserid: newReview.shopping_mall_memberuserid,
    shopping_mall_sale_snapshot_id: newReview.shopping_mall_sale_snapshot_id,
    review_title: newReview.review_title,
    review_body: newReview.review_body,
    rating: newReview.rating,
    is_private: newReview.is_private,
    status: newReview.status,
    created_at: toISOStringSafe(newReview.created_at),
    updated_at: toISOStringSafe(newReview.updated_at),
    deleted_at: newReview.deleted_at
      ? toISOStringSafe(newReview.deleted_at)
      : null,
  };
}
