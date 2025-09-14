import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallFavoriteProduct } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallFavoriteProduct";
import type { IShoppingMallFavoriteProduct } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallFavoriteProduct";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * Validates the favorite product search functionality for authenticated
 * member user.
 *
 * 1. Register a new member user and authenticate.
 * 2. Create multiple favorite products owned by the member user.
 * 3. Perform a paginated, sorted, and filtered search for favorite products
 *    linked to the user.
 * 4. Validate the search response pagination and confirm favorite products
 *    belong to the user.
 * 5. Confirm searching favorite products without authentication fails.
 */
export async function test_api_favorite_product_search_success_with_member_authentication(
  connection: api.IConnection,
) {
  // 1. Member user registration and authentication
  const memberUserBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(12),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: RandomGenerator.mobile(),
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;

  const memberUser = await api.functional.auth.memberUser.join(connection, {
    body: memberUserBody,
  });
  typia.assert(memberUser);

  // 2. Create several favorite products for the authenticated member user
  const favoriteProducts: IShoppingMallFavoriteProduct[] = [];
  for (let i = 0; i < 5; ++i) {
    const favoriteProductBody = {
      shopping_mall_memberuser_id: memberUser.id,
      shopping_mall_sale_snapshot_id: typia.random<
        string & tags.Format<"uuid">
      >(),
    } satisfies IShoppingMallFavoriteProduct.ICreate;

    const favoriteProduct =
      await api.functional.shoppingMall.memberUser.favoriteProducts.createFavoriteProduct(
        connection,
        {
          body: favoriteProductBody,
        },
      );
    typia.assert(favoriteProduct);
    favoriteProducts.push(favoriteProduct);
  }

  // 3. Search favorite products with pagination, sorting, filtering
  const searchRequest = {
    shopping_mall_memberuser_id: memberUser.id,
    page: 1,
    limit: 3,
    orderBy: "created_at",
  } satisfies IShoppingMallFavoriteProduct.IRequest;

  const searchResult =
    await api.functional.shoppingMall.memberUser.favoriteProducts.indexFavoriteProducts(
      connection,
      {
        body: searchRequest,
      },
    );
  typia.assert(searchResult);

  // 4. Validate pagination information
  TestValidator.predicate(
    "Pagination current page is 1",
    searchResult.pagination.current === 1,
  );
  TestValidator.predicate(
    "Pagination limit is 3",
    searchResult.pagination.limit === 3,
  );
  TestValidator.predicate(
    "Pagination total records is at least 5",
    searchResult.pagination.records >= 5,
  );

  // Validate each favorite product belongs to the member user and exists
  for (const product of searchResult.data) {
    TestValidator.equals(
      "Favorite product's member user ID matches",
      product.shopping_mall_memberuser_id,
      memberUser.id,
    );
    TestValidator.predicate(
      "Favorite product ID exists in created favorites",
      favoriteProducts.some((fav) => fav.id === product.id),
    );
  }

  // 5. Test searching without authentication to confirm error
  const unauthConnection: api.IConnection = { ...connection, headers: {} };
  await TestValidator.error(
    "Searching favorite products without authentication should fail",
    async () => {
      await api.functional.shoppingMall.memberUser.favoriteProducts.indexFavoriteProducts(
        unauthConnection,
        {
          body: searchRequest,
        },
      );
    },
  );
}
