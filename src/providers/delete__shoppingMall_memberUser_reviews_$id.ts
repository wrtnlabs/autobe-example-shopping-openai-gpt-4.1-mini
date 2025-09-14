import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Delete a product review by ID.
 *
 * This operation performs a hard delete of the review record from the database.
 *
 * Authorization is enforced: only the author (memberUser) of the review can
 * delete it.
 *
 * No response body is returned.
 *
 * @param props - Object containing the authenticated memberUser and the ID of
 *   the review to delete.
 * @param props.memberUser - The authenticated member user making the request.
 * @param props.id - The UUID of the review to delete.
 * @throws {Error} Throws if the review is not found.
 * @throws {Error} Throws if the authenticated user is not the author of the
 *   review.
 */
export async function delete__shoppingMall_memberUser_reviews_$id(props: {
  memberUser: MemberuserPayload;
  id: string & tags.Format<"uuid">;
}): Promise<void> {
  const { memberUser, id } = props;

  // Find the review by ID
  const review = await MyGlobal.prisma.shopping_mall_reviews.findUnique({
    where: { id },
  });

  if (!review) {
    throw new Error("Review not found");
  }

  // Authorization check: only the author memberUser can delete the review
  if (review.shopping_mall_memberuserid !== memberUser.id) {
    throw new Error("Unauthorized: Only the author can delete this review");
  }

  // Perform hard delete
  await MyGlobal.prisma.shopping_mall_reviews.delete({
    where: { id },
  });
}
