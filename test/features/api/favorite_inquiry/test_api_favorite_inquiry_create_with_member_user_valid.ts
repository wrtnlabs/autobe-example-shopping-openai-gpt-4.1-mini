import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallFavoriteInquiry } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallFavoriteInquiry";
import type { IShoppingMallInquiry } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallInquiry";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * Test the creation of a new favorite inquiry for a member user.
 *
 * This test performs the following steps:
 *
 * 1. Register a member user with the join API to get an authorized member
 *    user.
 * 2. Create a product inquiry for the member user.
 * 3. Use the member user ID and the inquiry snapshot ID from the inquiry to
 *    create a favorite inquiry.
 * 4. Verify that the favorite inquiry is successfully created with the
 *    expected data.
 */
export async function test_api_favorite_inquiry_create_with_member_user_valid(
  connection: api.IConnection,
) {
  // 1. Register a member user (join operation)
  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: {
        email: typia.random<string & tags.Format<"email">>(),
        password_hash: RandomGenerator.alphaNumeric(12),
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        phone_number: null,
        status: "active",
      } satisfies IShoppingMallMemberUser.ICreate,
    });
  typia.assert(memberUser);

  // 2. Create a product inquiry for the member user
  const inquiryBody = {
    shopping_mall_channel_id: typia.random<string & tags.Format<"uuid">>(),
    shopping_mall_memberuserid: memberUser.id,
    inquiry_title: RandomGenerator.paragraph({ sentences: 5 }),
    inquiry_body: RandomGenerator.content({ paragraphs: 2 }),
    is_private: false,
    status: "open",
  } satisfies IShoppingMallInquiry.ICreate;

  const inquiry: IShoppingMallInquiry =
    await api.functional.shoppingMall.memberUser.inquiries.create(connection, {
      body: inquiryBody,
    });
  typia.assert(inquiry);

  // 3. Create favorite inquiry using memberUser.id and inquiry.id as snapshot ID
  const favoriteInquiryBody = {
    shopping_mall_memberuser_id: memberUser.id,
    shopping_mall_inquiry_snapshot_id: inquiry.id,
  } satisfies IShoppingMallFavoriteInquiry.ICreate;

  const favoriteInquiry: IShoppingMallFavoriteInquiry =
    await api.functional.shoppingMall.memberUser.favoriteInquiries.create(
      connection,
      {
        body: favoriteInquiryBody,
      },
    );
  typia.assert(favoriteInquiry);

  // 4. Validate favorite inquiry response data
  TestValidator.equals(
    "favorite inquiry member user ID matches",
    favoriteInquiry.shopping_mall_memberuser_id,
    memberUser.id,
  );
  TestValidator.equals(
    "favorite inquiry inquiry snapshot ID matches",
    favoriteInquiry.shopping_mall_inquiry_snapshot_id,
    inquiry.id,
  );
}
