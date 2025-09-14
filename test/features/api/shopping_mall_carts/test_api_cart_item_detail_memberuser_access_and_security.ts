import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallCartItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCartItem";
import type { IShoppingMallCarts } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCarts";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * Validate member user cart item detail access and security.
 *
 * This test covers the entire typical process of member user cart item
 * detail usage:
 *
 * 1. Create a member user with required properties.
 * 2. Create a shopping cart associated with the created member user.
 * 3. Add an item to the cart with fully specified valid data.
 * 4. Successfully retrieve the cart item detail and verify its correctness.
 * 5. Attempt unauthorized access using a separate unauthorized member user and
 *    expect failure.
 *
 * This ensures both business correctness and access control compliance.
 */
export async function test_api_cart_item_detail_memberuser_access_and_security(
  connection: api.IConnection,
) {
  // 1. Create the first member user
  const memberUserBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(12),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: null,
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;

  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: memberUserBody,
    });
  typia.assert(memberUser);

  // 2. Create a shopping cart for the member user
  const cartBody = {
    member_user_id: memberUser.id,
    status: "active",
    guest_user_id: null,
  } satisfies IShoppingMallCarts.ICreate;

  const cart: IShoppingMallCarts =
    await api.functional.shoppingMall.memberUser.carts.createCart(connection, {
      body: cartBody,
    });
  typia.assert(cart);
  TestValidator.equals(
    "cart member user id matches",
    cart.member_user_id,
    memberUser.id,
  );

  // 3. Add a cart item to the created cart
  const cartItemBody = {
    shopping_cart_id: cart.id,
    shopping_sale_snapshot_id: typia.random<string & tags.Format<"uuid">>(),
    quantity: typia.random<number & tags.Type<"int32"> & tags.Minimum<1>>(),
    unit_price: Math.floor(Math.random() * 10000) + 100, // realistic price
    status: "pending",
  } satisfies IShoppingMallCartItem.ICreate;

  const cartItem: IShoppingMallCartItem =
    await api.functional.shoppingMall.memberUser.carts.cartItems.create(
      connection,
      {
        cartId: cart.id,
        body: cartItemBody,
      },
    );
  typia.assert(cartItem);
  TestValidator.equals(
    "cart item cart id matches",
    cartItem.shopping_cart_id,
    cart.id,
  );

  // 4. Retrieve the cart item and verify correctness
  const retrievedCartItem: IShoppingMallCartItem =
    await api.functional.shoppingMall.memberUser.carts.cartItems.at(
      connection,
      {
        cartId: cart.id,
        cartItemId: cartItem.id,
      },
    );
  typia.assert(retrievedCartItem);

  TestValidator.equals(
    "retrieved cart item matches cart item created",
    retrievedCartItem,
    cartItem,
  );

  // 5. Attempt unauthorized access with a different member user
  const otherMemberUserBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(12),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: null,
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;

  const otherMemberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: otherMemberUserBody,
    });
  typia.assert(otherMemberUser);

  // Create a new connection for otherMemberUser by re-authenticating
  await TestValidator.error(
    "unauthorized access to cart item should fail",
    async () => {
      await api.functional.shoppingMall.memberUser.carts.cartItems.at(
        connection,
        {
          cartId: cart.id,
          cartItemId: cartItem.id,
        },
      );
    },
  );
}
