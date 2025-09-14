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
 * This test validates paginated searching and filtering of shopping mall
 * channel-category mappings.
 *
 * It ensures authorized admin users can retrieve filtered paginated data
 * correctly, and verifies filtering on channel ID, category ID, soft delete
 * status, search term, and pagination.
 *
 * The test also verifies proper authorization (must login as adminUser),
 * and that API responses conform to expected structures.
 *
 * Detailed checks include result correctness, pagination metadata validity,
 * combinations of filters, empty results for invalid filters, and error
 * management for unauthorized access.
 */
export async function test_api_channel_category_search_pagination_filter(
  connection: api.IConnection,
) {
  // 1. Admin user registration and authentication
  const adminUserCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(20),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminUserCreateBody,
    });
  typia.assert(adminUser);

  // Unauthenticated connection with empty headers - should fail for authorization
  const unauthConn: api.IConnection = { ...connection, headers: {} };

  // 2. Attempt to call API without authorization (should fail authorization, expect error)
  await TestValidator.error(
    "should not allow unauthenticated request",
    async () => {
      await api.functional.shoppingMall.adminUser.channelCategories.indexChannelCategory(
        unauthConn,
        { body: {} satisfies IShoppingMallChannelCategory.IRequest },
      );
    },
  );

  // 3. Perform unfiltered query (empty body) to get initial page and data
  const initialResult: IPageIShoppingMallChannelCategory.ISummary =
    await api.functional.shoppingMall.adminUser.channelCategories.indexChannelCategory(
      connection,
      {
        body: {} satisfies IShoppingMallChannelCategory.IRequest,
      },
    );
  typia.assert(initialResult);

  const pagination = initialResult.pagination;
  const dataList = initialResult.data;

  TestValidator.predicate(
    "pagination current and limit non-negative",
    pagination.current >= 0 &&
      pagination.limit >= 0 &&
      pagination.pages >= 0 &&
      pagination.records >= 0,
  );

  TestValidator.predicate(
    "pages computes correctly",
    pagination.pages >= Math.ceil(pagination.records / pagination.limit),
  );

  // 4. If data present, validate each item's properties
  if (dataList.length > 0) {
    for (const item of dataList) {
      typia.assert<IShoppingMallChannelCategory.ISummary>(item);
    }
  }

  // 5. Randomly pick channel ID and category ID from initial data for filtering tests if available
  const channelIds = ArrayUtil.repeat(
    dataList.length,
    (i) => dataList[i]?.shopping_mall_channel_id,
  ).filter((id): id is string => id !== undefined && id !== null);
  const categoryIds = ArrayUtil.repeat(
    dataList.length,
    (i) => dataList[i]?.shopping_mall_category_id,
  ).filter((id): id is string => id !== undefined && id !== null);

  // Safe deduplication
  const distinctChannelIds = Array.from(new Set(channelIds));
  const distinctCategoryIds = Array.from(new Set(categoryIds));

  // 6. Test filter by shopping_mall_channel_id only
  if (distinctChannelIds.length > 0) {
    const filterChannelId = RandomGenerator.pick(distinctChannelIds);

    const byChannelResult: IPageIShoppingMallChannelCategory.ISummary =
      await api.functional.shoppingMall.adminUser.channelCategories.indexChannelCategory(
        connection,
        {
          body: {
            shopping_mall_channel_id: filterChannelId,
          } satisfies IShoppingMallChannelCategory.IRequest,
        },
      );
    typia.assert(byChannelResult);

    // Check all returned entries have shopping_mall_channel_id matching filter
    for (const entry of byChannelResult.data) {
      TestValidator.equals(
        "shopping_mall_channel_id filter match",
        entry.shopping_mall_channel_id,
        filterChannelId,
      );
    }
  }

  // 7. Test filter by shopping_mall_category_id only
  if (distinctCategoryIds.length > 0) {
    const filterCategoryId = RandomGenerator.pick(distinctCategoryIds);

    const byCategoryResult: IPageIShoppingMallChannelCategory.ISummary =
      await api.functional.shoppingMall.adminUser.channelCategories.indexChannelCategory(
        connection,
        {
          body: {
            shopping_mall_category_id: filterCategoryId,
          } satisfies IShoppingMallChannelCategory.IRequest,
        },
      );
    typia.assert(byCategoryResult);

    // Check all returned entries have shopping_mall_category_id matching filter
    for (const entry of byCategoryResult.data) {
      TestValidator.equals(
        "shopping_mall_category_id filter match",
        entry.shopping_mall_category_id,
        filterCategoryId,
      );
    }
  }

  // 8. Test combined filter: shopping_mall_channel_id and shopping_mall_category_id
  if (distinctChannelIds.length > 0 && distinctCategoryIds.length > 0) {
    const filterChannelId = RandomGenerator.pick(distinctChannelIds);
    const filterCategoryId = RandomGenerator.pick(distinctCategoryIds);

    const combinedFilterResult: IPageIShoppingMallChannelCategory.ISummary =
      await api.functional.shoppingMall.adminUser.channelCategories.indexChannelCategory(
        connection,
        {
          body: {
            shopping_mall_channel_id: filterChannelId,
            shopping_mall_category_id: filterCategoryId,
          } satisfies IShoppingMallChannelCategory.IRequest,
        },
      );
    typia.assert(combinedFilterResult);

    for (const entry of combinedFilterResult.data) {
      TestValidator.equals(
        "combined filter - channel ID match",
        entry.shopping_mall_channel_id,
        filterChannelId,
      );
      TestValidator.equals(
        "combined filter - category ID match",
        entry.shopping_mall_category_id,
        filterCategoryId,
      );
    }
  }

  // 9. Test filter by deleted_at true and false (soft delete filter)
  for (const deletedFlag of [true, false]) {
    const softDeleteFilter: IPageIShoppingMallChannelCategory.ISummary =
      await api.functional.shoppingMall.adminUser.channelCategories.indexChannelCategory(
        connection,
        {
          body: {
            deleted_at: deletedFlag,
          } satisfies IShoppingMallChannelCategory.IRequest,
        },
      );
    typia.assert(softDeleteFilter);

    // No direct way to verify all match deleted_at since data property lacks deleted_at
    // Just verify pagination meta valid
    TestValidator.predicate(
      `softDeleteFilter pagination valid for deleted_at=${deletedFlag}`,
      softDeleteFilter.pagination.current >= 0 &&
        softDeleteFilter.pagination.limit >= 0 &&
        softDeleteFilter.pagination.records >= 0 &&
        softDeleteFilter.pagination.pages >= 0,
    );
  }

  // 10. Test search with search text filter (using one of the existing IDs as search text)
  const someSearchText =
    dataList.length > 0
      ? dataList[0].shopping_mall_channel_id
      : "nonexistentsearch";
  const searchResult: IPageIShoppingMallChannelCategory.ISummary =
    await api.functional.shoppingMall.adminUser.channelCategories.indexChannelCategory(
      connection,
      {
        body: {
          search: someSearchText,
        } satisfies IShoppingMallChannelCategory.IRequest,
      },
    );
  typia.assert(searchResult);

  // Validate pagination meta
  TestValidator.predicate(
    "search filter pagination valid",
    searchResult.pagination.current >= 0 &&
      searchResult.pagination.limit >= 0 &&
      searchResult.pagination.records >= 0 &&
      searchResult.pagination.pages >= 0,
  );

  // Entries data check if any data
  for (const entry of searchResult.data) {
    typia.assert<IShoppingMallChannelCategory.ISummary>(entry);
  }

  // 11. Test pagination control with page and limit parameters
  const pageNumber = 1;
  const pageLimit = 5;

  const paginatedResult: IPageIShoppingMallChannelCategory.ISummary =
    await api.functional.shoppingMall.adminUser.channelCategories.indexChannelCategory(
      connection,
      {
        body: {
          page: pageNumber satisfies number as number,
          limit: pageLimit satisfies number as number,
        } satisfies IShoppingMallChannelCategory.IRequest,
      },
    );
  typia.assert(paginatedResult);

  TestValidator.equals(
    "pagination page number matches",
    paginatedResult.pagination.current,
    pageNumber,
  );
  TestValidator.equals(
    "pagination limit matches",
    paginatedResult.pagination.limit,
    pageLimit,
  );

  // Data count should be less or equal limit
  TestValidator.predicate(
    "paginated data count valid",
    paginatedResult.data.length <= pageLimit,
  );

  // 12. Test invalid filters to cause empty result set
  const invalidFilterResult: IPageIShoppingMallChannelCategory.ISummary =
    await api.functional.shoppingMall.adminUser.channelCategories.indexChannelCategory(
      connection,
      {
        body: {
          shopping_mall_channel_id: typia.random<
            string & tags.Format<"uuid">
          >(),
          shopping_mall_category_id: typia.random<
            string & tags.Format<"uuid">
          >(),
          deleted_at: false,
          search: "nomatchsearchterm",
        } satisfies IShoppingMallChannelCategory.IRequest,
      },
    );
  typia.assert(invalidFilterResult);

  TestValidator.equals(
    "empty result for invalid filters",
    invalidFilterResult.data.length,
    0,
  );
  TestValidator.predicate(
    "pagination metadata valid for empty result",
    invalidFilterResult.pagination.current >= 0 &&
      invalidFilterResult.pagination.limit >= 0 &&
      invalidFilterResult.pagination.records >= 0 &&
      invalidFilterResult.pagination.pages >= 0,
  );
}
