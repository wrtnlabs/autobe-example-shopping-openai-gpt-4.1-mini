import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallFavoriteInquiry } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallFavoriteInquiry";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Update favorite inquiry by ID.
 *
 * This operation updates an existing favorite inquiry record identified by its
 * unique ID. Only the owning member user can update their favorite inquiries.
 * It allows modification of the inquiry snapshot reference and deletion
 * timestamp. The updated_at timestamp is automatically refreshed.
 *
 * @param props - Object containing memberUser auth, favoriteInquiryId path
 *   param, and update body
 * @returns The updated favorite inquiry record
 * @throws {Error} When the favorite inquiry is not found or unauthorized access
 */
export async function put__shoppingMall_memberUser_favoriteInquiries_$favoriteInquiryId(props: {
  memberUser: MemberuserPayload;
  favoriteInquiryId: string & tags.Format<"uuid">;
  body: IShoppingMallFavoriteInquiry.IUpdate;
}): Promise<IShoppingMallFavoriteInquiry> {
  const { memberUser, favoriteInquiryId, body } = props;

  // Fetch favorite inquiry and validate ownership
  const existing =
    await MyGlobal.prisma.shopping_mall_favorite_inquiries.findUniqueOrThrow({
      where: { id: favoriteInquiryId },
    });

  if (existing.shopping_mall_memberuser_id !== memberUser.id) {
    throw new Error(
      "Unauthorized: You can only update your own favorite inquiries",
    );
  }

  // Perform update with provided fields and updated_at timestamp
  const updated = await MyGlobal.prisma.shopping_mall_favorite_inquiries.update(
    {
      where: { id: favoriteInquiryId },
      data: {
        shopping_mall_inquiry_snapshot_id:
          body.shopping_mall_inquiry_snapshot_id ?? undefined,
        deleted_at: body.deleted_at ?? undefined,
        updated_at: toISOStringSafe(new Date()),
      },
    },
  );

  // Return updated record with ISO string date conversions
  return {
    id: updated.id,
    shopping_mall_memberuser_id: updated.shopping_mall_memberuser_id,
    shopping_mall_inquiry_snapshot_id:
      updated.shopping_mall_inquiry_snapshot_id,
    created_at: toISOStringSafe(updated.created_at),
    updated_at: toISOStringSafe(updated.updated_at),
    deleted_at: updated.deleted_at ? toISOStringSafe(updated.deleted_at) : null,
  };
}
