import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallFavoriteInquiry } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallFavoriteInquiry";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Retrieves a specific favorite inquiry by ID for the authenticated member
 * user.
 *
 * This operation securely fetches the favorite inquiry record identified by
 * `favoriteInquiryId` only if it belongs to the authenticated member user. It
 * ensures authorization by matching the owner ID, excludes deleted entries
 * (soft delete), and returns precise audit timestamps.
 *
 * @param props - Object containing the authenticated member user and the
 *   favorite inquiry ID
 * @param props.memberUser - Authenticated member user performing the query
 * @param props.favoriteInquiryId - Unique identifier for the target favorite
 *   inquiry
 * @returns The favorite inquiry record conforming to
 *   IShoppingMallFavoriteInquiry
 * @throws {Error} Throws if no matching favorite inquiry is found or
 *   unauthorized access
 */
export async function get__shoppingMall_memberUser_favoriteInquiries_$favoriteInquiryId(props: {
  memberUser: MemberuserPayload;
  favoriteInquiryId: string & tags.Format<"uuid">;
}): Promise<IShoppingMallFavoriteInquiry> {
  const { memberUser, favoriteInquiryId } = props;

  const record =
    await MyGlobal.prisma.shopping_mall_favorite_inquiries.findUniqueOrThrow({
      where: {
        id: favoriteInquiryId,
        shopping_mall_memberuser_id: memberUser.id,
        deleted_at: null,
      },
    });

  return {
    id: record.id,
    shopping_mall_memberuser_id: record.shopping_mall_memberuser_id,
    shopping_mall_inquiry_snapshot_id: record.shopping_mall_inquiry_snapshot_id,
    created_at: toISOStringSafe(record.created_at),
    updated_at: toISOStringSafe(record.updated_at),
    deleted_at: record.deleted_at ? toISOStringSafe(record.deleted_at) : null,
  };
}
