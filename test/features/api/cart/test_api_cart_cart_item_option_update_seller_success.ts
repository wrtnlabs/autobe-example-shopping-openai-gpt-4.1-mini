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

/**
 * This E2E test validates the successful update of a cart item option by a
 * seller user. It covers the full workflow involving multi-actor
 * authentication, shopping cart and cart item creation, adding a cart item
 * option as a member user, and then updating that option as a seller user. The
 * test ensures that the update integrates properly with existing cart item
 * option data, respects authorization boundaries, and that the updated values
 * reflect the changes requested.
 *
 * Steps include:
 *
 * 1. Register a seller user and authenticate.
 * 2. Register a member user and authenticate.
 * 3. Member user creates a new shopping cart.
 * 4. Member user adds a new cart item to their cart.
 * 5. Member user adds a new cart item option to the cart item.
 * 6. Seller user re-authenticates to switch user context.
 * 7. Seller user updates the cart item option with new option group and sale
 *    option IDs.
 * 8. Validate response matches expectations.
 *
 * All API responses are asserted to be fully typed and valid.
 */
export async function test_api_cart_cart_item_option_update_seller_success(
  connection: api.IConnection,
) {
  // 1. Seller user joins
  const sellerCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password: RandomGenerator.alphaNumeric(12),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: RandomGenerator.mobile(),
    business_registration_number: `BRN${RandomGenerator.alphaNumeric(9).toUpperCase()}`,
  } satisfies IShoppingMallSellerUser.ICreate;
  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: sellerCreateBody,
    });
  typia.assert(sellerUser);

  // 2. Member user joins
  const memberCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(12),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: RandomGenerator.mobile(),
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;
  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: memberCreateBody,
    });
  typia.assert(memberUser);

  // 3. Member user login to authenticate
  await api.functional.auth.memberUser.login(connection, {
    body: {
      email: memberCreateBody.email,
      password: memberCreateBody.password_hash,
    } satisfies IShoppingMallMemberUser.ILogin,
  });

  // 4. Member user creates a new shopping cart
  const cartCreateBody = {
    member_user_id: memberUser.id,
    status: "active",
  } satisfies IShoppingMallCarts.ICreate;
  const cart: IShoppingMallCarts =
    await api.functional.shoppingMall.memberUser.carts.createCart(connection, {
      body: cartCreateBody,
    });
  typia.assert(cart);

  // 5. Member user adds a new cart item
  // Using random valid data and quantity 1, status "pending" to represent newly added item
  const cartItemCreateBody = {
    shopping_cart_id: cart.id,
    shopping_sale_snapshot_id: typia.random<string & tags.Format<"uuid">>(),
    quantity: 1,
    unit_price: 10000,
    status: "pending",
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

  // 6. Member user adds a new cart item option
  const optionGroupId1 = typia.random<string & tags.Format<"uuid">>();
  const saleOptionId1 = typia.random<string & tags.Format<"uuid">>();
  const cartItemOptionCreateBody = {
    shopping_cart_item_id: cartItem.id,
    shopping_sale_option_group_id: optionGroupId1,
    shopping_sale_option_id: saleOptionId1,
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

  // 7. Seller user login to switch context
  await api.functional.auth.sellerUser.login(connection, {
    body: {
      email: sellerCreateBody.email,
      password: sellerCreateBody.password,
    } satisfies IShoppingMallSellerUser.ILogin,
  });

  // 8. Seller updates the cart item option
  const optionGroupId2 = typia.random<string & tags.Format<"uuid">>();
  const saleOptionId2 = typia.random<string & tags.Format<"uuid">>();
  const cartItemOptionUpdateBody = {
    shopping_cart_item_id: cartItem.id,
    shopping_sale_option_group_id: optionGroupId2,
    shopping_sale_option_id: saleOptionId2,
  } satisfies IShoppingMallCartItemOption.IUpdate;
  const updatedCartItemOption: IShoppingMallCartItemOption =
    await api.functional.shoppingMall.sellerUser.cartItems.cartItemOptions.updateCartItemOption(
      connection,
      {
        cartItemId: cartItem.id,
        cartItemOptionId: cartItemOption.id,
        body: cartItemOptionUpdateBody,
      },
    );
  typia.assert(updatedCartItemOption);

  // 9. Validate updated values
  TestValidator.equals(
    "updated cartItemOption shopping_cart_item_id matches",
    updatedCartItemOption.shopping_cart_item_id,
    cartItemOptionUpdateBody.shopping_cart_item_id,
  );
  TestValidator.equals(
    "updated cartItemOption shopping_sale_option_group_id matches",
    updatedCartItemOption.shopping_sale_option_group_id,
    cartItemOptionUpdateBody.shopping_sale_option_group_id,
  );
  TestValidator.equals(
    "updated cartItemOption shopping_sale_option_id matches",
    updatedCartItemOption.shopping_sale_option_id,
    cartItemOptionUpdateBody.shopping_sale_option_id,
  );
}
