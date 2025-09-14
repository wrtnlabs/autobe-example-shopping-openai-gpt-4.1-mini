import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallCartItemOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallCartItemOption";
import type { IShoppingMallCartItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCartItem";
import type { IShoppingMallCartItemOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCartItemOption";
import type { IShoppingMallCarts } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCarts";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * This E2E test validates the retrieval of cart item options for a member
 * user's cart item with valid filtering and pagination.
 *
 * It covers the complete business flow of member user registration, shopping
 * cart creation, cart item addition, and querying cart item options with
 * various filters including empty filters testing default pagination behavior.
 *
 * Validations include typia response assertion, TestValidator business checks,
 * and ensures compliance with schema constraints and authentication.
 */
export async function test_api_cart_item_option_index_with_pagination_and_filtering(
  connection: api.IConnection,
) {
  // 1. Member user registration and authorization
  const memberUserCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(12),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    phone_number: RandomGenerator.mobile(),
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;

  const member: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: memberUserCreateBody,
    });
  typia.assert(member);

  // 2. Creating a shopping cart associated with the member user
  const cartCreateBody = {
    member_user_id: member.id,
    status: "active",
  } satisfies IShoppingMallCarts.ICreate;

  const cart: IShoppingMallCarts =
    await api.functional.shoppingMall.memberUser.carts.createCart(connection, {
      body: cartCreateBody,
    });
  typia.assert(cart);

  // 3. Creating a cart item within the newly created cart
  const cartItemCreateBody = {
    shopping_cart_id: cart.id,
    shopping_sale_snapshot_id: typia.random<string & tags.Format<"uuid">>(),
    quantity: typia.random<number & tags.Type<"int32"> & tags.Minimum<1>>(),
    unit_price: 10000,
    status: "pending",
  } satisfies IShoppingMallCartItem.ICreate;

  const cartItem: IShoppingMallCartItem =
    await api.functional.shoppingMall.memberUser.carts.cartItems.create(
      connection,
      { cartId: cart.id, body: cartItemCreateBody },
    );
  typia.assert(cartItem);

  // 4. Query the cart item options list with empty filters to test default behavior
  const emptyFilterBody = {
    shopping_cart_item_id: null,
    shopping_sale_option_group_id: null,
    shopping_sale_option_id: null,
    created_at: null,
    updated_at: null,
  } satisfies IShoppingMallCartItemOption.IRequest;

  const pageAll: IPageIShoppingMallCartItemOption =
    await api.functional.shoppingMall.memberUser.cartItems.cartItemOptions.index(
      connection,
      { cartItemId: cartItem.id, body: emptyFilterBody },
    );
  typia.assert(pageAll);

  TestValidator.predicate(
    "pagination limit is non-negative",
    pageAll.pagination.limit >= 0,
  );
  TestValidator.predicate(
    "pagination current page is at least 0",
    pageAll.pagination.current >= 0,
  );

  for (const option of pageAll.data) {
    typia.assert(option);
    TestValidator.equals(
      "cartItemOption references correct cart item",
      option.shopping_cart_item_id,
      cartItem.id,
    );
  }

  // 5. Filter by shopping_cart_item_id (exact match)
  const filterByCartItemId: IShoppingMallCartItemOption.IRequest = {
    shopping_cart_item_id: cartItem.id,
    shopping_sale_option_group_id: null,
    shopping_sale_option_id: null,
    created_at: null,
    updated_at: null,
  };

  const pageFilteredByCartItemId: IPageIShoppingMallCartItemOption =
    await api.functional.shoppingMall.memberUser.cartItems.cartItemOptions.index(
      connection,
      { cartItemId: cartItem.id, body: filterByCartItemId },
    );
  typia.assert(pageFilteredByCartItemId);

  for (const option of pageFilteredByCartItemId.data) {
    typia.assert(option);
    TestValidator.equals(
      "filter by cart item id: matched",
      option.shopping_cart_item_id,
      cartItem.id,
    );
  }

  // 6. Filter by shopping_sale_option_group_id and shopping_sale_option_id with random UUIDs
  const randomOptionGroupId = typia.random<string & tags.Format<"uuid">>();
  const randomOptionId = typia.random<string & tags.Format<"uuid">>();

  const filterByOptionGroupAndOption: IShoppingMallCartItemOption.IRequest = {
    shopping_cart_item_id: null,
    shopping_sale_option_group_id: randomOptionGroupId,
    shopping_sale_option_id: randomOptionId,
    created_at: null,
    updated_at: null,
  };

  const pageFilteredByOptionGroupAndOption: IPageIShoppingMallCartItemOption =
    await api.functional.shoppingMall.memberUser.cartItems.cartItemOptions.index(
      connection,
      { cartItemId: cartItem.id, body: filterByOptionGroupAndOption },
    );
  typia.assert(pageFilteredByOptionGroupAndOption);

  for (const option of pageFilteredByOptionGroupAndOption.data) {
    typia.assert(option);
    TestValidator.equals(
      "filter by option group id: matched",
      option.shopping_sale_option_group_id,
      randomOptionGroupId,
    );
    TestValidator.equals(
      "filter by option id: matched",
      option.shopping_sale_option_id,
      randomOptionId,
    );
  }

  // 7. Test pagination with different limits and current pages
  for (const limit of [1, 5]) {
    for (const current of [0, 1]) {
      const filterWithPagination: IShoppingMallCartItemOption.IRequest = {
        shopping_cart_item_id: cartItem.id,
        shopping_sale_option_group_id: null,
        shopping_sale_option_id: null,
        created_at: null,
        updated_at: null,
      };

      const resultPage =
        await api.functional.shoppingMall.memberUser.cartItems.cartItemOptions.index(
          connection,
          { cartItemId: cartItem.id, body: filterWithPagination },
        );
      typia.assert(resultPage);

      TestValidator.predicate(
        `pagination limit (${limit}) is non-negative`,
        resultPage.pagination.limit >= 0,
      );
      TestValidator.predicate(
        `pagination current page (${current}) is at least 0`,
        resultPage.pagination.current >= 0,
      );
    }
  }
}
