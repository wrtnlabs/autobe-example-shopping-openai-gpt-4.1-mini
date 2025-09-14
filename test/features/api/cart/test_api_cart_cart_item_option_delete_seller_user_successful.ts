import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallCartItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCartItem";
import type { IShoppingMallCartItemOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCartItemOption";
import type { IShoppingMallCarts } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCarts";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

export async function test_api_cart_cart_item_option_delete_seller_user_successful(
  connection: api.IConnection,
) {
  // 1. Seller user signs up
  const sellerUserCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password: "password123",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    phone_number: RandomGenerator.mobile(),
    business_registration_number: RandomGenerator.alphaNumeric(12),
  } satisfies IShoppingMallSellerUser.ICreate;

  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: sellerUserCreateBody,
    });
  typia.assert(sellerUser);

  // 2. Seller user login
  const sellerUserLoginBody = {
    email: sellerUserCreateBody.email,
    password: "password123",
  } satisfies IShoppingMallSellerUser.ILogin;

  await api.functional.auth.sellerUser.login(connection, {
    body: sellerUserLoginBody,
  });

  // 3. Member user signs up
  const memberUserCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: "password123",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    phone_number: RandomGenerator.mobile(),
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;

  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: memberUserCreateBody,
    });
  typia.assert(memberUser);

  // 4. Member user login
  const memberUserLoginBody = {
    email: memberUserCreateBody.email,
    password: "password123",
  } satisfies IShoppingMallMemberUser.ILogin;

  await api.functional.auth.memberUser.login(connection, {
    body: memberUserLoginBody,
  });

  // 5. Seller user login again to switch to seller role
  await api.functional.auth.sellerUser.login(connection, {
    body: sellerUserLoginBody,
  });

  // 6. Seller user creates a shopping cart, linked to member user
  const cartCreateBody = {
    member_user_id: memberUser.id,
    status: "active",
  } satisfies IShoppingMallCarts.ICreate;

  const cart: IShoppingMallCarts =
    await api.functional.shoppingMall.memberUser.carts.createCart(connection, {
      body: cartCreateBody,
    });
  typia.assert(cart);

  // 7. Seller user adds a cart item to the shopping cart
  const cartItemCreateBody = {
    shopping_cart_id: cart.id,
    shopping_sale_snapshot_id: typia.random<string & tags.Format<"uuid">>(),
    quantity: 1,
    unit_price: 10000,
    status: "active",
  } satisfies IShoppingMallCartItem.ICreate;

  const cartItem: IShoppingMallCartItem =
    await api.functional.shoppingMall.memberUser.carts.cartItems.create(
      connection,
      {
        cartId: cart.id,
        body: cartItemCreateBody,
      },
    );
  typia.assert(cartItem);

  // 8. Seller user adds a cart item option to the cart item
  const cartItemOptionCreateBody = {
    shopping_cart_item_id: cartItem.id,
    shopping_sale_option_group_id: typia.random<string & tags.Format<"uuid">>(),
    shopping_sale_option_id: typia.random<string & tags.Format<"uuid">>(),
  } satisfies IShoppingMallCartItemOption.ICreate;

  const cartItemOption: IShoppingMallCartItemOption =
    await api.functional.shoppingMall.memberUser.cartItems.cartItemOptions.create(
      connection,
      {
        cartItemId: cartItem.id,
        body: cartItemOptionCreateBody,
      },
    );
  typia.assert(cartItemOption);

  // 9. Seller user deletes the cart item option
  await api.functional.shoppingMall.memberUser.cartItems.cartItemOptions.eraseCartItemOption(
    connection,
    {
      cartItemId: cartItem.id,
      cartItemOptionId: cartItemOption.id,
    },
  );

  // 10. Deletion has no response, ensure no errors thrown
  TestValidator.predicate("cart item option deletion successful", true);
}
