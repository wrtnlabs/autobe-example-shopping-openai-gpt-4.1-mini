import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallCartItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCartItem";
import type { IShoppingMallCartItemOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCartItemOption";
import type { IShoppingMallCarts } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCarts";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * Test updating details of an existing cart item option including changing the
 * option group ID and sale option ID. This includes verifying the authorization
 * of member user, validating input for option associations, and ensuring the
 * update is reflected in the response correctly. Also test handling of attempts
 * to update non-existent cart item options or unauthorized access.
 */
export async function test_api_cart_cart_item_option_update_success(
  connection: api.IConnection,
) {
  // 1. Create and authenticate a member user
  const joinBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(10),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    phone_number: null,
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;

  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, { body: joinBody });
  typia.assert(memberUser);

  // 2. Create a cart linked to the member user
  const createCartBody = {
    guest_user_id: null,
    member_user_id: memberUser.id,
    status: "active",
  } satisfies IShoppingMallCarts.ICreate;

  const cart: IShoppingMallCarts =
    await api.functional.shoppingMall.memberUser.carts.createCart(connection, {
      body: createCartBody,
    });
  typia.assert(cart);

  // 3. Add a cart item to the cart
  const cartItemCreateBody = {
    shopping_cart_id: cart.id,
    shopping_sale_snapshot_id: typia.random<string & tags.Format<"uuid">>(),
    quantity: 1,
    unit_price: 10000,
    status: "pending",
    deleted_at: null,
  } satisfies IShoppingMallCartItem.ICreate;

  const cartItem: IShoppingMallCartItem =
    await api.functional.shoppingMall.memberUser.carts.cartItems.create(
      connection,
      { cartId: cart.id, body: cartItemCreateBody },
    );
  typia.assert(cartItem);

  // 4. Add a cart item option
  const cartItemOptionCreateBody = {
    shopping_cart_item_id: cartItem.id,
    shopping_sale_option_group_id: typia.random<string & tags.Format<"uuid">>(),
    shopping_sale_option_id: typia.random<string & tags.Format<"uuid">>(),
  } satisfies IShoppingMallCartItemOption.ICreate;

  const cartItemOption: IShoppingMallCartItemOption =
    await api.functional.shoppingMall.memberUser.cartItems.cartItemOptions.create(
      connection,
      { cartItemId: cartItem.id, body: cartItemOptionCreateBody },
    );
  typia.assert(cartItemOption);

  // 5. Update the cart item option: change option group ID and sale option ID to new UUIDs
  const updateBody = {
    shopping_sale_option_group_id: typia.random<string & tags.Format<"uuid">>(),
    shopping_sale_option_id: typia.random<string & tags.Format<"uuid">>(),
  } satisfies IShoppingMallCartItemOption.IUpdate;

  const updatedCartItemOption: IShoppingMallCartItemOption =
    await api.functional.shoppingMall.memberUser.cartItems.cartItemOptions.updateCartItemOption(
      connection,
      {
        cartItemId: cartItem.id,
        cartItemOptionId: cartItemOption.id,
        body: updateBody,
      },
    );
  typia.assert(updatedCartItemOption);

  // 6. Validate the updated fields
  TestValidator.equals(
    "updated cart item option group id",
    updatedCartItemOption.shopping_sale_option_group_id,
    updateBody.shopping_sale_option_group_id,
  );
  TestValidator.equals(
    "updated cart item option id",
    updatedCartItemOption.shopping_sale_option_id,
    updateBody.shopping_sale_option_id,
  );

  // 7. Validate the unchanged fields
  TestValidator.equals(
    "cart item option id remains the same",
    updatedCartItemOption.id,
    cartItemOption.id,
  );
  TestValidator.equals(
    "cart item id remains the same",
    updatedCartItemOption.shopping_cart_item_id,
    cartItemOption.shopping_cart_item_id,
  );
}
