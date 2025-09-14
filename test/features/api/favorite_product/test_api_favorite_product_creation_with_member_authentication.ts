import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallFavoriteProduct } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallFavoriteProduct";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * This E2E test validates creating a favorite product by a member user.
 *
 * It performs:
 *
 * 1. Member user registration with required data including explicit null
 *    phone_number.
 * 2. Uses returned authorized user to create a favorite product linked to
 *    their user id and a random snapshot id.
 * 3. Asserts successful creation and validates ownership.
 */
export async function test_api_favorite_product_creation_with_member_authentication(
  connection: api.IConnection,
) {
  // 1. Member user registration with required fields and explicit null phone_number
  const userCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(32),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: null, // explicit null as allowed
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;

  const authorizedUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: userCreateBody,
    });
  typia.assert(authorizedUser);

  // 2. Create favorite product linked to the registered member user
  // Using a random valid UUID string for snapshot reference
  const favoriteCreateBody = {
    shopping_mall_memberuser_id: authorizedUser.id,
    shopping_mall_sale_snapshot_id: typia.random<
      string & tags.Format<"uuid">
    >(),
  } satisfies IShoppingMallFavoriteProduct.ICreate;

  const favorite: IShoppingMallFavoriteProduct =
    await api.functional.shoppingMall.memberUser.favoriteProducts.createFavoriteProduct(
      connection,
      { body: favoriteCreateBody },
    );
  typia.assert(favorite);

  // 3. Validate the favorite product owner matches the authenticated user
  TestValidator.equals(
    "favorite product owner matches authenticated user",
    favorite.shopping_mall_memberuser_id,
    authorizedUser.id,
  );
}
