import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallCategory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCategory";
import type { IShoppingMallChannel } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallChannel";
import type { IShoppingMallFavoriteInquiry } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallFavoriteInquiry";
import type { IShoppingMallInquiry } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallInquiry";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * This E2E test validates the full workflow of member user authentication,
 * product category and channel creation by admin user, seller user
 * creation, product inquiry creation by member user, favorite inquiry
 * creation, and finally retrieves the favorite inquiry by its unique
 * identifier to verify that the data returned matches the created favorite
 * inquiry record.
 *
 * Steps:
 *
 * 1. Create and authenticate a member user using /auth/memberUser/join.
 * 2. Create a product category using /shoppingMall/adminUser/categories.
 * 3. Create a product channel using /shoppingMall/adminUser/channels.
 * 4. Create and authenticate a seller user using /auth/sellerUser/join.
 * 5. Create a product inquiry using /shoppingMall/memberUser/inquiries with
 *    the context of the created member user, category, and channel.
 * 6. Create a favorite inquiry entry for the member user using the newly
 *    created inquiry snapshot ID.
 * 7. Retrieve the favorite inquiry by ID using GET
 *    /shoppingMall/memberUser/favoriteInquiries/{favoriteInquiryId} and
 *    verify the response data matches the expected favorite inquiry created
 *    earlier.
 *
 * Validation includes typia.assert usage for type validation and
 * TestValidator.equals to check data consistency especially the retrieved
 * favorite inquiry id and its member user and inquiry snapshot references.
 *
 * This test ensures the correct working of favorite inquiry retrieval
 * endpoint after end-to-end creation and setup of all dependent entities.
 */
export async function test_api_favorite_inquiry_at_success(
  connection: api.IConnection,
) {
  // 1. Create and authenticate a member user
  const memberUserEmail: string = typia.random<string & tags.Format<"email">>();
  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: {
        email: memberUserEmail,
        password_hash: "1234",
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        phone_number: null,
        status: "active",
      } satisfies IShoppingMallMemberUser.ICreate,
    });
  typia.assert(memberUser);

  // 2. Create a product category
  const adminUserEmail: string = typia.random<string & tags.Format<"email">>();
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: adminUserEmail,
        password_hash: "1234",
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  const category: IShoppingMallCategory =
    await api.functional.shoppingMall.adminUser.categories.create(connection, {
      body: {
        code: RandomGenerator.alphaNumeric(8),
        name: RandomGenerator.name(),
        status: "active",
        description: null,
      } satisfies IShoppingMallCategory.ICreate,
    });
  typia.assert(category);

  // 3. Create a product channel
  const channel: IShoppingMallChannel =
    await api.functional.shoppingMall.adminUser.channels.create(connection, {
      body: {
        code: RandomGenerator.alphaNumeric(8),
        name: RandomGenerator.name(),
        description: null,
        status: "active",
      } satisfies IShoppingMallChannel.ICreate,
    });
  typia.assert(channel);

  // 4. Create and authenticate a seller user
  const sellerUserEmail: string = typia.random<string & tags.Format<"email">>();
  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: {
        email: sellerUserEmail,
        password: "1234",
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        phone_number: null,
        business_registration_number: RandomGenerator.alphaNumeric(10),
      } satisfies IShoppingMallSellerUser.ICreate,
    });
  typia.assert(sellerUser);

  // 5. Create a product inquiry
  const inquiry: IShoppingMallInquiry =
    await api.functional.shoppingMall.memberUser.inquiries.create(connection, {
      body: {
        shopping_mall_channel_id: channel.id,
        shopping_mall_category_id: category.id,
        shopping_mall_memberuserid: memberUser.id,
        inquiry_title: RandomGenerator.paragraph({ sentences: 4 }),
        inquiry_body: RandomGenerator.content({ paragraphs: 3 }),
        is_private: false,
        is_answered: false,
        status: "open",
      } satisfies IShoppingMallInquiry.ICreate,
    });
  typia.assert(inquiry);

  // 6. Create a favorite inquiry referencing the member user and inquiry snapshot
  const favoriteInquiry: IShoppingMallFavoriteInquiry =
    await api.functional.shoppingMall.memberUser.favoriteInquiries.create(
      connection,
      {
        body: {
          shopping_mall_memberuser_id: memberUser.id,
          shopping_mall_inquiry_snapshot_id: inquiry.id,
        } satisfies IShoppingMallFavoriteInquiry.ICreate,
      },
    );
  typia.assert(favoriteInquiry);

  // 7. Retrieve the favorite inquiry by its ID
  const retrievedFavoriteInquiry: IShoppingMallFavoriteInquiry =
    await api.functional.shoppingMall.memberUser.favoriteInquiries.at(
      connection,
      {
        favoriteInquiryId: favoriteInquiry.id,
      },
    );
  typia.assert(retrievedFavoriteInquiry);

  // Validation
  TestValidator.equals(
    "favorite inquiry id matches",
    retrievedFavoriteInquiry.id,
    favoriteInquiry.id,
  );
  TestValidator.equals(
    "member user id matches",
    retrievedFavoriteInquiry.shopping_mall_memberuser_id,
    memberUser.id,
  );
  TestValidator.equals(
    "inquiry snapshot id matches",
    retrievedFavoriteInquiry.shopping_mall_inquiry_snapshot_id,
    inquiry.id,
  );
}
