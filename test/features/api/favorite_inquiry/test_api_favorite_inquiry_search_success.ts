import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallFavoriteInquiry } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallFavoriteInquiry";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallCategory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCategory";
import type { IShoppingMallChannel } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallChannel";
import type { IShoppingMallFavoriteInquiry } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallFavoriteInquiry";
import type { IShoppingMallInquiry } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallInquiry";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

export async function test_api_favorite_inquiry_search_success(
  connection: api.IConnection,
) {
  // 1. Create and join a member user
  const memberUserEmail = typia.random<string & tags.Format<"email">>();
  const memberUser = await api.functional.auth.memberUser.join(connection, {
    body: {
      email: memberUserEmail,
      password_hash: "P@ssword12345",
      nickname: RandomGenerator.name(),
      full_name: RandomGenerator.name(),
      phone_number: RandomGenerator.mobile(),
      status: "active",
    } satisfies IShoppingMallMemberUser.ICreate,
  });
  typia.assert(memberUser);

  // 2. Create and join an admin user
  const adminUserEmail = typia.random<string & tags.Format<"email">>();
  const adminUser = await api.functional.auth.adminUser.join(connection, {
    body: {
      email: adminUserEmail,
      password_hash: "AdminPass123",
      nickname: RandomGenerator.name(),
      full_name: RandomGenerator.name(),
      status: "active",
    } satisfies IShoppingMallAdminUser.ICreate,
  });
  typia.assert(adminUser);

  // 3. Login as admin user to create channel and category
  await api.functional.auth.adminUser.login(connection, {
    body: {
      email: adminUser.email,
      password_hash: "AdminPass123",
    } satisfies IShoppingMallAdminUser.ILogin,
  });

  // 4. Create a product channel
  const channelCode = RandomGenerator.alphaNumeric(6);
  const channel = await api.functional.shoppingMall.adminUser.channels.create(
    connection,
    {
      body: {
        code: channelCode,
        name: RandomGenerator.name(2),
        description: RandomGenerator.paragraph({ sentences: 5 }),
        status: "active",
      } satisfies IShoppingMallChannel.ICreate,
    },
  );
  typia.assert(channel);

  // 5. Create a product category
  const categoryCode = RandomGenerator.alphaNumeric(6);
  const category =
    await api.functional.shoppingMall.adminUser.categories.create(connection, {
      body: {
        code: categoryCode,
        name: RandomGenerator.name(2),
        status: "active",
        description: RandomGenerator.paragraph({ sentences: 4 }),
      } satisfies IShoppingMallCategory.ICreate,
    });
  typia.assert(category);

  // 6. Login as member user
  await api.functional.auth.memberUser.login(connection, {
    body: {
      email: memberUser.email,
      password: "P@ssword12345",
    } satisfies IShoppingMallMemberUser.ILogin,
  });

  // 7. Create a product inquiry by member user with references
  const inquiryTitle = RandomGenerator.paragraph({
    sentences: 3,
    wordMin: 4,
    wordMax: 7,
  });
  const inquiryBody = RandomGenerator.content({
    paragraphs: 2,
    sentenceMin: 6,
    sentenceMax: 10,
    wordMin: 5,
    wordMax: 9,
  });
  const inquiry = await api.functional.shoppingMall.memberUser.inquiries.create(
    connection,
    {
      body: {
        shopping_mall_channel_id: channel.id,
        shopping_mall_section_id: null,
        shopping_mall_category_id: category.id,
        shopping_mall_memberuserid: memberUser.id,
        shopping_mall_guestuserid: null,
        parent_inquiry_id: null,
        inquiry_title: inquiryTitle,
        inquiry_body: inquiryBody,
        is_private: false,
        is_answered: false,
        status: "open",
      } satisfies IShoppingMallInquiry.ICreate,
    },
  );
  typia.assert(inquiry);

  // 8. Create a favorite inquiry entry for the inquiry
  const favoriteInquiry =
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

  // 9. Perform a paginated search for favorite inquiries
  const page = 1;
  const limit = 10;
  const searchResult =
    await api.functional.shoppingMall.memberUser.favoriteInquiries.indexFavoriteInquiries(
      connection,
      {
        body: {
          shopping_mall_memberuser_id: memberUser.id,
          page: page,
          limit: limit,
          orderBy: "created_at",
        } satisfies IShoppingMallFavoriteInquiry.IRequest,
      },
    );
  typia.assert(searchResult);

  // 10. Validate pagination info
  TestValidator.predicate(
    "pagination current matches requested page",
    searchResult.pagination.current === page,
  );
  TestValidator.predicate(
    "pagination limit matches requested limit",
    searchResult.pagination.limit === limit,
  );
  TestValidator.predicate(
    "pagination records are non-negative",
    searchResult.pagination.records >= 0,
  );
  TestValidator.predicate(
    "pagination pages are at least 1",
    searchResult.pagination.pages >= 1,
  );

  // 11. Validate favorite inquiry is included in the search results
  TestValidator.predicate(
    "favorite inquiry is in search result",
    searchResult.data.some((fav) => fav.id === favoriteInquiry.id),
  );

  // 12. Validate properties of found favorite inquiry summary
  const foundFavorite = searchResult.data.find(
    (fav) => fav.id === favoriteInquiry.id,
  );
  TestValidator.predicate(
    "found favorite is not undefined",
    foundFavorite !== undefined,
  );
  if (foundFavorite !== undefined) {
    TestValidator.equals(
      "favorite shopping_mall_inquiry_snapshot_id match",
      foundFavorite.shopping_mall_inquiry_snapshot_id,
      favoriteInquiry.shopping_mall_inquiry_snapshot_id,
    );
    TestValidator.predicate(
      "favorite created_at is a valid ISO date",
      typeof foundFavorite.created_at === "string" &&
        foundFavorite.created_at.length > 0,
    );
  }
}
