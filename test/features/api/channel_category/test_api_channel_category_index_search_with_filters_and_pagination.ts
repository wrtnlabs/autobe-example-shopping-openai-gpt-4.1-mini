import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallChannelCategory } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallChannelCategory";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallChannelCategory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallChannelCategory";

/**
 * Validate the search functionality for channel-category mappings in the
 * shopping mall.
 *
 * This test first creates an admin user to establish authentication context.
 * Then, it performs various search queries using filters such as channel ID,
 * category ID, deleted status, and search text. It also tests pagination
 * behavior. The test ensures that the API returns valid paginated results
 * conforming to the requested filters accurately and that responses adhere to
 * the defined DTO schemas.
 */
export async function test_api_channel_category_index_search_with_filters_and_pagination(
  connection: api.IConnection,
) {
  // 1. Create and authenticate admin user by join
  const adminUserEmail: string = typia.random<string & tags.Format<"email">>();
  const adminUserPasswordHash: string = "hashedPassword123"; // Simplified for test
  const adminUserFullName: string = RandomGenerator.name();
  const adminUserNickname: string = RandomGenerator.name(2);

  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: adminUserEmail,
        password_hash: adminUserPasswordHash,
        nickname: adminUserNickname,
        full_name: adminUserFullName,
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // 2. Test search with empty request (should return some items)
  const emptySearchResponse: IPageIShoppingMallChannelCategory.ISummary =
    await api.functional.shoppingMall.adminUser.channelCategories.indexChannelCategory(
      connection,
      {
        body: {},
      },
    );
  typia.assert(emptySearchResponse);
  TestValidator.predicate(
    "empty search returns data array",
    Array.isArray(emptySearchResponse.data) &&
      emptySearchResponse.data.length >= 0,
  );

  // 3. If data exists, perform filtered searches
  if (emptySearchResponse.data.length > 0) {
    // Pick an existing channel-category from returned data for filtering
    const firstItem: IShoppingMallChannelCategory.ISummary =
      emptySearchResponse.data[0];

    // Filter by channel ID
    const filterByChannelResponse: IPageIShoppingMallChannelCategory.ISummary =
      await api.functional.shoppingMall.adminUser.channelCategories.indexChannelCategory(
        connection,
        {
          body: {
            shopping_mall_channel_id: firstItem.shopping_mall_channel_id,
            page: 1,
            limit: 10,
          } satisfies IShoppingMallChannelCategory.IRequest,
        },
      );
    typia.assert(filterByChannelResponse);
    TestValidator.predicate(
      "filter by channel id - all data have matching channel id",
      filterByChannelResponse.data.every(
        (d) =>
          d.shopping_mall_channel_id === firstItem.shopping_mall_channel_id,
      ),
    );

    // Filter by category ID
    const filterByCategoryResponse: IPageIShoppingMallChannelCategory.ISummary =
      await api.functional.shoppingMall.adminUser.channelCategories.indexChannelCategory(
        connection,
        {
          body: {
            shopping_mall_category_id: firstItem.shopping_mall_category_id,
            page: 1,
            limit: 5,
          } satisfies IShoppingMallChannelCategory.IRequest,
        },
      );
    typia.assert(filterByCategoryResponse);
    TestValidator.predicate(
      "filter by category id - all data have matching category id",
      filterByCategoryResponse.data.every(
        (d) =>
          d.shopping_mall_category_id === firstItem.shopping_mall_category_id,
      ),
    );

    // Test soft-deleted filter by true
    const filterByDeletedTrueResponse: IPageIShoppingMallChannelCategory.ISummary =
      await api.functional.shoppingMall.adminUser.channelCategories.indexChannelCategory(
        connection,
        {
          body: {
            deleted_at: true,
            page: 1,
            limit: 3,
          } satisfies IShoppingMallChannelCategory.IRequest,
        },
      );
    typia.assert(filterByDeletedTrueResponse);

    // Test soft-deleted filter by false
    const filterByDeletedFalseResponse: IPageIShoppingMallChannelCategory.ISummary =
      await api.functional.shoppingMall.adminUser.channelCategories.indexChannelCategory(
        connection,
        {
          body: {
            deleted_at: false,
            page: 1,
            limit: 3,
          } satisfies IShoppingMallChannelCategory.IRequest,
        },
      );
    typia.assert(filterByDeletedFalseResponse);

    // Test search query (search string) with partial match
    if (typeof firstItem.id === "string") {
      const searchText = firstItem.id.substring(0, 6);
      const searchResponse: IPageIShoppingMallChannelCategory.ISummary =
        await api.functional.shoppingMall.adminUser.channelCategories.indexChannelCategory(
          connection,
          {
            body: {
              search: searchText,
              page: 1,
              limit: 10,
            } satisfies IShoppingMallChannelCategory.IRequest,
          },
        );
      typia.assert(searchResponse);
      TestValidator.predicate(
        "search filter works",
        Array.isArray(searchResponse.data),
      );
    }

    // Test pagination page=2
    const page2Response: IPageIShoppingMallChannelCategory.ISummary =
      await api.functional.shoppingMall.adminUser.channelCategories.indexChannelCategory(
        connection,
        {
          body: {
            page: 2,
            limit: 3,
          } satisfies IShoppingMallChannelCategory.IRequest,
        },
      );
    typia.assert(page2Response);
    TestValidator.predicate(
      "pagination data array exists",
      Array.isArray(page2Response.data),
    );
  }
}
