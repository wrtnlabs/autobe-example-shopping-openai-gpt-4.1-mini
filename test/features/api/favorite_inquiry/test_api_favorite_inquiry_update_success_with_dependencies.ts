import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallFavoriteInquiry } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallFavoriteInquiry";
import type { IShoppingMallInquiry } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallInquiry";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * Validates update of an existing favorite inquiry by a member user after all
 * required dependencies for context setup.
 *
 * This test performs the full workflow of:
 *
 * 1. Member user sign-up and authentication.
 * 2. Creating a product inquiry belonging to the user.
 * 3. Creating a favorite inquiry referencing the inquiry snapshot.
 * 4. Updating the favorite inquiry's inquiry snapshot reference.
 * 5. Validating the update was successful and response data integrity.
 */
export async function test_api_favorite_inquiry_update_success_with_dependencies(
  connection: api.IConnection,
) {
  // 1. Member user sign-up
  const memberCreationBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(12),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: RandomGenerator.mobile(),
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;

  const member: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: memberCreationBody,
    });
  typia.assert(member);

  // 2. Create product inquiry under this user context
  const inquiryCreationBody = {
    shopping_mall_channel_id: typia.random<string & tags.Format<"uuid">>(),
    inquiry_title: RandomGenerator.paragraph({
      sentences: 4,
      wordMin: 4,
      wordMax: 7,
    }),
    inquiry_body: RandomGenerator.content({ paragraphs: 2 }),
    is_private: false,
    status: "open",
    shopping_mall_memberuserid: member.id,
    shopping_mall_section_id: null,
    shopping_mall_category_id: null,
    shopping_mall_guestuserid: null,
    parent_inquiry_id: null,
  } satisfies IShoppingMallInquiry.ICreate;

  const inquiry: IShoppingMallInquiry =
    await api.functional.shoppingMall.memberUser.inquiries.create(connection, {
      body: inquiryCreationBody,
    });
  typia.assert(inquiry);

  // 3. Create a favorite inquiry referencing inquiry snapshot
  // For this example, use inquiry.id as snapshot since no snapshot entity is provided
  // (The schema expects inquiry snapshot id as string, so assume inquiry id is suitable here)

  const favoriteInquiryCreationBody = {
    shopping_mall_memberuser_id: member.id,
    shopping_mall_inquiry_snapshot_id: inquiry.id,
  } satisfies IShoppingMallFavoriteInquiry.ICreate;

  const favoriteInquiry: IShoppingMallFavoriteInquiry =
    await api.functional.shoppingMall.memberUser.favoriteInquiries.create(
      connection,
      {
        body: favoriteInquiryCreationBody,
      },
    );
  typia.assert(favoriteInquiry);

  // 4. Update favorite inquiry's inquiry snapshot reference (simulate with new inquiry snapshot id)

  // Generate a new inquiry snapshot id for update
  const newInquirySnapshotId = typia.random<string & tags.Format<"uuid">>();

  const favoriteInquiryUpdateBody = {
    shopping_mall_inquiry_snapshot_id: newInquirySnapshotId,
  } satisfies IShoppingMallFavoriteInquiry.IUpdate;

  const updatedFavoriteInquiry: IShoppingMallFavoriteInquiry =
    await api.functional.shoppingMall.memberUser.favoriteInquiries.update(
      connection,
      {
        favoriteInquiryId: favoriteInquiry.id satisfies string &
          tags.Format<"uuid">,
        body: favoriteInquiryUpdateBody,
      },
    );
  typia.assert(updatedFavoriteInquiry);

  // 5. Validate updated data integrity
  TestValidator.equals(
    "Favorite inquiry id remains same after update",
    updatedFavoriteInquiry.id,
    favoriteInquiry.id,
  );
  TestValidator.equals(
    "Member user id remains consistent",
    updatedFavoriteInquiry.shopping_mall_memberuser_id,
    favoriteInquiry.shopping_mall_memberuser_id,
  );
  TestValidator.equals(
    "Inquiry snapshot id updated correctly",
    updatedFavoriteInquiry.shopping_mall_inquiry_snapshot_id,
    newInquirySnapshotId,
  );
  TestValidator.predicate(
    "updated_at marker is updated",
    updatedFavoriteInquiry.updated_at !== favoriteInquiry.updated_at,
  );
  TestValidator.predicate(
    "created_at marker remains",
    updatedFavoriteInquiry.created_at === favoriteInquiry.created_at,
  );
  TestValidator.equals(
    "deleted_at remains null",
    updatedFavoriteInquiry.deleted_at ?? null,
    favoriteInquiry.deleted_at ?? null,
  );
}
