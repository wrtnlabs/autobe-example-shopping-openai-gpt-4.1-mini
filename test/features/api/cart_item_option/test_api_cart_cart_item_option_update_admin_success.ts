import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallCartItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCartItem";
import type { IShoppingMallCartItemOption } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCartItemOption";
import type { IShoppingMallCarts } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCarts";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * Test the update operation for cart item options by an admin user including
 * authorization enforcement, data validation, and successful modification of
 * option group and sale option IDs.
 */
export async function test_api_cart_cart_item_option_update_admin_success(
  connection: api.IConnection,
) {
  // Admin user join
  const adminCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(16),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;
  const adminUser = await api.functional.auth.adminUser.join(connection, {
    body: adminCreateBody,
  });
  typia.assert(adminUser);

  // Admin user login (simulate role switching for credentials)
  const adminUserLoginBody = {
    email: adminCreateBody.email,
    password_hash: adminCreateBody.password_hash,
  } satisfies IShoppingMallAdminUser.ILogin;
  await api.functional.auth.adminUser.login(connection, {
    body: adminUserLoginBody,
  });

  // Member user join
  const memberUserPassword = RandomGenerator.alphaNumeric(16);
  const memberCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: memberUserPassword,
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: null,
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;
  const memberUser = await api.functional.auth.memberUser.join(connection, {
    body: memberCreateBody,
  });
  typia.assert(memberUser);

  // Member user login
  const memberUserLoginBody = {
    email: memberCreateBody.email,
    password: memberUserPassword,
  } satisfies IShoppingMallMemberUser.ILogin;
  await api.functional.auth.memberUser.login(connection, {
    body: memberUserLoginBody,
  });

  // Create shopping cart as member user
  const createCartBody = {
    guest_user_id: null,
    member_user_id: memberUser.id,
    status: "active",
  } satisfies IShoppingMallCarts.ICreate;
  const shoppingCart =
    await api.functional.shoppingMall.memberUser.carts.createCart(connection, {
      body: createCartBody,
    });
  typia.assert(shoppingCart);

  // Add a new cart item in the cart
  const cartItemCreateBody = {
    shopping_cart_id: shoppingCart.id,
    shopping_sale_snapshot_id: typia.random<string & tags.Format<"uuid">>(),
    quantity: 1,
    unit_price: 10000,
    status: "pending",
    deleted_at: null,
  } satisfies IShoppingMallCartItem.ICreate;
  const cartItem =
    await api.functional.shoppingMall.memberUser.carts.cartItems.create(
      connection,
      {
        cartId: shoppingCart.id,
        body: cartItemCreateBody,
      },
    );
  typia.assert(cartItem);

  // Add a new option to the cart item
  const cartItemOptionCreateBody = {
    shopping_cart_item_id: cartItem.id,
    shopping_sale_option_group_id: typia.random<string & tags.Format<"uuid">>(),
    shopping_sale_option_id: typia.random<string & tags.Format<"uuid">>(),
  } satisfies IShoppingMallCartItemOption.ICreate;
  const cartItemOption =
    await api.functional.shoppingMall.memberUser.cartItems.cartItemOptions.create(
      connection,
      {
        cartItemId: cartItem.id,
        body: cartItemOptionCreateBody,
      },
    );
  typia.assert(cartItemOption);

  // Switch to admin user login (simulate role switching to admin)
  await api.functional.auth.adminUser.login(connection, {
    body: adminUserLoginBody,
  });

  // Successful update test with admin user
  const updateBody = {
    shopping_sale_option_group_id: typia.random<string & tags.Format<"uuid">>(),
    shopping_sale_option_id: typia.random<string & tags.Format<"uuid">>(),
  } satisfies IShoppingMallCartItemOption.IUpdate;

  const updatedOption =
    await api.functional.shoppingMall.adminUser.cartItems.cartItemOptions.updateCartItemOption(
      connection,
      {
        cartItemId: cartItem.id,
        cartItemOptionId: cartItemOption.id,
        body: updateBody,
      },
    );
  typia.assert(updatedOption);
  TestValidator.equals(
    "updated option id equals original",
    updatedOption.id,
    cartItemOption.id,
  );
  TestValidator.equals(
    "updated shopping_cart_item_id equals original",
    updatedOption.shopping_cart_item_id,
    cartItem.id,
  );
  TestValidator.equals(
    "updated option group id changed",
    updatedOption.shopping_sale_option_group_id,
    updateBody.shopping_sale_option_group_id,
  );
  TestValidator.equals(
    "updated option id changed",
    updatedOption.shopping_sale_option_id,
    updateBody.shopping_sale_option_id,
  );

  // Error test: update non-existing cart item option
  await TestValidator.error(
    "update non-existing cart item option fails",
    async () => {
      await api.functional.shoppingMall.adminUser.cartItems.cartItemOptions.updateCartItemOption(
        connection,
        {
          cartItemId: cartItem.id,
          cartItemOptionId: typia.random<string & tags.Format<"uuid">>(),
          body: updateBody,
        },
      );
    },
  );

  // Error test: update with invalid data - test business error, not type error
  await TestValidator.error(
    "update with invalid data should fail",
    async () => {
      // Empty update body to simulate invalid update (no changes)
      await api.functional.shoppingMall.adminUser.cartItems.cartItemOptions.updateCartItemOption(
        connection,
        {
          cartItemId: cartItem.id,
          cartItemOptionId: cartItemOption.id,
          body: {},
        },
      );
    },
  );
}
