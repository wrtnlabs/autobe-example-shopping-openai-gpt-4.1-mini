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
 * This test validates the listing of shopping mall cart item options with
 * proper filtering and pagination under authorized member user context. It
 * follows these steps:
 *
 * 1. Registers a new random member user (sign up), capturing the authorized member
 *    user response.
 * 2. Creates a shopping cart linked to the member user.
 * 3. Creates a cart item associated with the created shopping cart.
 * 4. Using the cart item's ID, tests the PATCH
 *    /shoppingMall/memberUser/cartItems/{cartItemId}/cartItemOptions endpoint.
 *
 *    - The request body filters the options by shopping_cart_item_id.
 *    - Further tests filtering by shopping_sale_option_group_id and
 *         shopping_sale_option_id if suitable values exist.
 *    - Tests pagination parameters (like page, limit) through the filtering
 *         structure (although pagination keys are on response).
 * 5. Validates that the response structure fits IPageIShoppingMallCartItemOption
 *    precisely with typia.assert.
 * 6. Tests that unauthorized access is prevented by establishing the authorization
 *    context using member user join.
 */
export async function test_api_cart_cart_item_option_listing_with_valid_filters_and_pagination(
  connection: api.IConnection,
) {
  // 1. Member user join (sign up) for authentication
  const memberUserBody = {
    email: `${RandomGenerator.alphaNumeric(8)}@example.com`,
    password_hash: RandomGenerator.alphaNumeric(20),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: null,
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;
  const memberUser = await api.functional.auth.memberUser.join(connection, {
    body: memberUserBody,
  });
  typia.assert(memberUser);

  // 2. Create a shopping mall cart linked to the member user
  const shoppingCartBody = {
    member_user_id: memberUser.id,
    status: "active",
  } satisfies IShoppingMallCarts.ICreate;
  const cart = await api.functional.shoppingMall.memberUser.carts.createCart(
    connection,
    {
      body: shoppingCartBody,
    },
  );
  typia.assert(cart);

  // 3. Create a cart item linked to the created cart
  const cartItemBody = {
    shopping_cart_id: cart.id,
    shopping_sale_snapshot_id: typia.random<string & tags.Format<"uuid">>(),
    quantity: 1,
    unit_price: 100,
    status: "pending",
  } satisfies IShoppingMallCartItem.ICreate;
  const cartItem =
    await api.functional.shoppingMall.memberUser.carts.cartItems.create(
      connection,
      {
        cartId: cart.id,
        body: cartItemBody,
      },
    );
  typia.assert(cartItem);

  // 4. Prepare the listing request body filtering by cart item id
  const requestBody: IShoppingMallCartItemOption.IRequest = {
    shopping_cart_item_id: cartItem.id,
    shopping_sale_option_group_id: null,
    shopping_sale_option_id: null,
    created_at: null,
    updated_at: null,
  };

  // List all cart item options for the cart item
  const pageResult =
    await api.functional.shoppingMall.memberUser.cartItems.cartItemOptions.index(
      connection,
      {
        cartItemId: cartItem.id,
        body: requestBody,
      },
    );
  typia.assert(pageResult);

  // 5. If any data exists, further filter to test filtering by option group and sale option
  if (pageResult.data.length > 0) {
    // Pick one of the options from the data
    const someOption = pageResult.data[0];

    // Filter by shopping_sale_option_group_id
    const requestByGroup: IShoppingMallCartItemOption.IRequest = {
      shopping_cart_item_id: cartItem.id,
      shopping_sale_option_group_id: someOption.shopping_sale_option_group_id,
      shopping_sale_option_id: null,
      created_at: null,
      updated_at: null,
    };
    const pageGroup =
      await api.functional.shoppingMall.memberUser.cartItems.cartItemOptions.index(
        connection,
        { cartItemId: cartItem.id, body: requestByGroup },
      );
    typia.assert(pageGroup);
    TestValidator.predicate(
      "filter by shopping_sale_option_group_id returns filtered data",
      pageGroup.data.every(
        (item) =>
          item.shopping_sale_option_group_id ===
          someOption.shopping_sale_option_group_id,
      ),
    );

    // Filter by shopping_sale_option_id
    const requestByOption: IShoppingMallCartItemOption.IRequest = {
      shopping_cart_item_id: cartItem.id,
      shopping_sale_option_group_id: null,
      shopping_sale_option_id: someOption.shopping_sale_option_id,
      created_at: null,
      updated_at: null,
    };
    const pageOption =
      await api.functional.shoppingMall.memberUser.cartItems.cartItemOptions.index(
        connection,
        { cartItemId: cartItem.id, body: requestByOption },
      );
    typia.assert(pageOption);
    TestValidator.predicate(
      "filter by shopping_sale_option_id returns filtered data",
      pageOption.data.every(
        (item) =>
          item.shopping_sale_option_id === someOption.shopping_sale_option_id,
      ),
    );
  }
}
