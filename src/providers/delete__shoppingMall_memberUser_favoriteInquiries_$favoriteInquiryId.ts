import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Deletes (soft deletes) a favorite inquiry for the authenticated member user.
 *
 * This endpoint marks the favorite inquiry identified by favoriteInquiryId as
 * deleted by setting the deleted_at timestamp. It verifies that the
 * authenticated member user owns the favorite inquiry before performing the
 * soft delete.
 *
 * @param props - Object containing memberUser payload and favoriteInquiryId
 *   parameter
 * @param props.memberUser - Authenticated member user requesting the deletion
 * @param props.favoriteInquiryId - UUID of the favorite inquiry to be soft
 *   deleted
 * @throws {Error} When favorite inquiry does not belong to the authenticated
 *   member user
 * @throws {Error} When favorite inquiry is not found
 */
export async function delete__shoppingMall_memberUser_favoriteInquiries_$favoriteInquiryId(props: {
  memberUser: MemberuserPayload;
  favoriteInquiryId: string & tags.Format<"uuid">;
}): Promise<void> {
  const { memberUser, favoriteInquiryId } = props;

  const favoriteInquiry =
    await MyGlobal.prisma.shopping_mall_favorite_inquiries.findUniqueOrThrow({
      where: { id: favoriteInquiryId },
    });

  if (favoriteInquiry.shopping_mall_memberuser_id !== memberUser.id) {
    throw new Error(
      "Unauthorized: You can only delete your own favorite inquiries.",
    );
  }

  const deletedAt = toISOStringSafe(new Date());

  await MyGlobal.prisma.shopping_mall_favorite_inquiries.update({
    where: { id: favoriteInquiryId },
    data: { deleted_at: deletedAt },
  });
}
