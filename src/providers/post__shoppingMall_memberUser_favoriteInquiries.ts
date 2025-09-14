import jwt from "jsonwebtoken";
import { MyGlobal } from "../MyGlobal";
import typia, { tags } from "typia";
import { Prisma } from "@prisma/client";
import { v4 } from "uuid";
import { toISOStringSafe } from "../util/toISOStringSafe";
import { IShoppingMallFavoriteInquiry } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallFavoriteInquiry";
import { MemberuserPayload } from "../decorators/payload/MemberuserPayload";

/**
 * Creates a new favorite inquiry entry for a member user referencing an inquiry
 * snapshot.
 *
 * This operation ensures that a member user can only create a favorite inquiry
 * for themselves. It prevents duplicates by checking if a favorite already
 * exists for the given member user and inquiry snapshot.
 *
 * @param props - Object containing the authenticated member user and creation
 *   data.
 * @param props.memberUser - The authenticated member user creating the
 *   favorite.
 * @param props.body - The favorite inquiry creation data including member user
 *   ID and inquiry snapshot ID.
 * @returns The newly created favorite inquiry record with timestamps.
 * @throws {Error} When the authenticated member user ID does not match the
 *   creation data member user ID.
 * @throws {Error} When a duplicate favorite inquiry already exists for the same
 *   member user and inquiry snapshot.
 */
export async function post__shoppingMall_memberUser_favoriteInquiries(props: {
  memberUser: MemberuserPayload;
  body: IShoppingMallFavoriteInquiry.ICreate;
}): Promise<IShoppingMallFavoriteInquiry> {
  const { memberUser, body } = props;

  if (memberUser.id !== body.shopping_mall_memberuser_id) {
    throw new Error(
      "Unauthorized: Cannot create favorite inquiry for another member user",
    );
  }

  const existing =
    await MyGlobal.prisma.shopping_mall_favorite_inquiries.findFirst({
      where: {
        shopping_mall_memberuser_id: body.shopping_mall_memberuser_id,
        shopping_mall_inquiry_snapshot_id:
          body.shopping_mall_inquiry_snapshot_id,
        deleted_at: null,
      },
    });

  if (existing !== null) {
    throw new Error(
      "Duplicate favorite inquiry for the same inquiry snapshot is not allowed",
    );
  }

  const now = toISOStringSafe(new Date());
  const newId = v4() as string & tags.Format<"uuid">;

  const created = await MyGlobal.prisma.shopping_mall_favorite_inquiries.create(
    {
      data: {
        id: newId,
        shopping_mall_memberuser_id: body.shopping_mall_memberuser_id,
        shopping_mall_inquiry_snapshot_id:
          body.shopping_mall_inquiry_snapshot_id,
        created_at: now,
        updated_at: now,
        deleted_at: null,
      },
    },
  );

  return {
    id: created.id,
    shopping_mall_memberuser_id: created.shopping_mall_memberuser_id,
    shopping_mall_inquiry_snapshot_id:
      created.shopping_mall_inquiry_snapshot_id,
    created_at: toISOStringSafe(created.created_at),
    updated_at: toISOStringSafe(created.updated_at),
    deleted_at: null,
  };
}
