import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallFavoriteProduct } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallFavoriteProduct";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * Scenario: Test the full flow for an authenticated member user to retrieve
 * detailed favorite product information by favoriteProductId.
 *
 * Steps:
 *
 * 1. Join a new member user via the authentication join endpoint.
 * 2. Create a favorite product entry for the member user.
 * 3. Retrieve that favorite product's detailed information by favoriteProductId.
 * 4. Validate the returned data against expected values and typia assertion.
 * 5. Attempt to retrieve favorite product detail with an unauthenticated
 *    connection and expect failure.
 */
export async function test_api_favorite_product_detail_retrieve_with_member_authentication(
  connection: api.IConnection,
) {
  // 1. Create member user via join
  const memberUserCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(20),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    phone_number: null,
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;

  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: memberUserCreateBody,
    });
  typia.assert(memberUser);

  // 2. Create favorite product for the member user
  const favoriteProductCreateBody = {
    shopping_mall_memberuser_id: memberUser.id,
    shopping_mall_sale_snapshot_id: typia.random<
      string & tags.Format<"uuid">
    >(),
  } satisfies IShoppingMallFavoriteProduct.ICreate;

  const favoriteProduct: IShoppingMallFavoriteProduct =
    await api.functional.shoppingMall.memberUser.favoriteProducts.createFavoriteProduct(
      connection,
      { body: favoriteProductCreateBody },
    );
  typia.assert(favoriteProduct);
  TestValidator.equals(
    "favorite product member user id",
    favoriteProduct.shopping_mall_memberuser_id,
    memberUser.id,
  );

  // 3. Retrieve favorite product detail by ID
  const retrievedFavoriteProduct: IShoppingMallFavoriteProduct =
    await api.functional.shoppingMall.memberUser.favoriteProducts.atFavoriteProduct(
      connection,
      { favoriteProductId: favoriteProduct.id },
    );
  typia.assert(retrievedFavoriteProduct);
  TestValidator.equals(
    "retrieved favorite product matches created",
    retrievedFavoriteProduct,
    favoriteProduct,
  );

  // 4. Attempt to retrieve favorite product detail with unauthenticated connection, expect failure
  {
    const unauthenticatedConnection: api.IConnection = {
      ...connection,
      headers: {},
    };
    await TestValidator.error(
      "unauthenticated access should fail",
      async () => {
        await api.functional.shoppingMall.memberUser.favoriteProducts.atFavoriteProduct(
          unauthenticatedConnection,
          { favoriteProductId: favoriteProduct.id },
        );
      },
    );
  }
}
