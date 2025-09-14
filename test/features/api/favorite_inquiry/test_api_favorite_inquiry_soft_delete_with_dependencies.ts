import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallFavoriteInquiry } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallFavoriteInquiry";
import type { IShoppingMallInquiry } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallInquiry";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * Test soft deletion of a favorite inquiry by a member user.
 *
 * This test performs the entire business workflow:
 *
 * 1. Create a member user and perform signup to obtain authentication.
 * 2. Create a product inquiry linked to the member user.
 * 3. Create a favorite inquiry linked to the member user and the inquiry
 *    snapshot.
 * 4. Soft delete the favorite inquiry using the DELETE API endpoint.
 * 5. Since no API for fetching the favorite inquiry exists, confirm the delete
 *    operation succeeded by ensuring no error occurred during deletion.
 *
 * The test enforces strict type safety with `typia.assert` calls after API
 * responses and uses `TestValidator` to verify expected outcomes.
 *
 * Nullable properties are explicitly set to `null` where allowed.
 *
 * All API calls use correct request body types and path parameters as
 * specified by the API schemas.
 */
export async function test_api_favorite_inquiry_soft_delete_with_dependencies(
  connection: api.IConnection,
) {
  // 1. Create member user by joining via auth.memberUser.join
  // Generate member user creation request body with valid email, hashed password, and other required fields
  const memberUserJoinBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(10),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: null, // explicitly use null for nullable property
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;

  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: memberUserJoinBody,
    });
  typia.assert(memberUser);

  // Member user automatically authenticated on join

  // 2. Create inquiry
  const inquiryCreateBody = {
    shopping_mall_channel_id: typia.random<string & tags.Format<"uuid">>(),
    shopping_mall_section_id: null, // explicit null
    shopping_mall_category_id: null, // explicit null
    shopping_mall_memberuserid: memberUser.id,
    shopping_mall_guestuserid: null, // explicit null
    parent_inquiry_id: null, // explicit null
    inquiry_title: RandomGenerator.paragraph({ sentences: 3 }),
    inquiry_body: RandomGenerator.content({ paragraphs: 2 }),
    is_private: false,
    is_answered: false,
    status: "open",
  } satisfies IShoppingMallInquiry.ICreate;

  const inquiry: IShoppingMallInquiry =
    await api.functional.shoppingMall.memberUser.inquiries.create(connection, {
      body: inquiryCreateBody,
    });
  typia.assert(inquiry);

  // 3. Create favorite inquiry referencing member user and inquiry ID (as snapshot ID)
  const favoriteInquiryCreateBody = {
    shopping_mall_memberuser_id: memberUser.id,
    shopping_mall_inquiry_snapshot_id: inquiry.id,
  } satisfies IShoppingMallFavoriteInquiry.ICreate;

  const favoriteInquiry: IShoppingMallFavoriteInquiry =
    await api.functional.shoppingMall.memberUser.favoriteInquiries.create(
      connection,
      {
        body: favoriteInquiryCreateBody,
      },
    );
  typia.assert(favoriteInquiry);

  // 4. Soft delete the favorite inquiry
  await api.functional.shoppingMall.memberUser.favoriteInquiries.erase(
    connection,
    {
      favoriteInquiryId: favoriteInquiry.id,
    },
  );

  // 5. No direct fetch API for favorite inquiry to confirm deleted_at
  //    Thus, confirm deletion only by no error thrown (successful completion)
  TestValidator.predicate("soft delete executed without error", true);
}
