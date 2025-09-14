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
 * E2E test function to verify the retrieval of a specific cart item option
 * by an admin user for a given cart item. This test covers the full
 * workflow from user creation, authentication, cart and item setup, to
 * fetching and validating the cart item option.
 *
 * The test follows these steps:
 *
 * 1. Create and authenticate an admin user.
 * 2. Create and authenticate a member user.
 * 3. Create a shopping cart for the member user.
 * 4. Add a cart item into the member user's cart.
 * 5. Add a cart item option to the created cart item.
 * 6. Switch to admin user session.
 * 7. Retrieve the cart item option using the admin endpoint.
 * 8. Validate the response for correctness and matching data.
 * 9. Test error conditions such as invalid cart item option ID.
 */
export async function test_api_cart_item_option_at_valid_admin_user(
  connection: api.IConnection,
) {
  // 1. Admin user creation
  const adminUserEmail = typia.random<string & tags.Format<"email">>();
  const adminUserPassword = "password1234";
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: adminUserEmail,
        password_hash: adminUserPassword,
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // 2. Admin user login for role switch confirmation
  await api.functional.auth.adminUser.login(connection, {
    body: {
      email: adminUserEmail,
      password_hash: adminUserPassword,
    } satisfies IShoppingMallAdminUser.ILogin,
  });

  // 3. Member user creation
  const memberUserEmail = typia.random<string & tags.Format<"email">>();
  const memberUserPassword = "password1234";
  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: {
        email: memberUserEmail,
        password_hash: memberUserPassword,
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        phone_number: null,
        status: "active",
      } satisfies IShoppingMallMemberUser.ICreate,
    });
  typia.assert(memberUser);

  // 4. Member user login
  await api.functional.auth.memberUser.login(connection, {
    body: {
      email: memberUserEmail,
      password: memberUserPassword,
    } satisfies IShoppingMallMemberUser.ILogin,
  });

  // 5. Create a cart for the member user
  const cart: IShoppingMallCarts =
    await api.functional.shoppingMall.memberUser.carts.createCart(connection, {
      body: {
        member_user_id: memberUser.id,
        guest_user_id: null,
        status: "active",
      } satisfies IShoppingMallCarts.ICreate,
    });
  typia.assert(cart);

  // 6. Create a cart item for the cart
  const cartItem: IShoppingMallCartItem =
    await api.functional.shoppingMall.memberUser.carts.cartItems.create(
      connection,
      {
        cartId: cart.id,
        body: {
          shopping_cart_id: cart.id,
          shopping_sale_snapshot_id: typia.random<
            string & tags.Format<"uuid">
          >(),
          quantity: 1,
          unit_price: 1000,
          status: "pending",
        } satisfies IShoppingMallCartItem.ICreate,
      },
    );
  typia.assert(cartItem);

  // 7. Add an option to the cart item
  const cartItemOption: IShoppingMallCartItemOption =
    await api.functional.shoppingMall.memberUser.cartItems.cartItemOptions.create(
      connection,
      {
        cartItemId: cartItem.id,
        body: {
          shopping_cart_item_id: cartItem.id,
          shopping_sale_option_group_id: typia.random<
            string & tags.Format<"uuid">
          >(),
          shopping_sale_option_id: typia.random<string & tags.Format<"uuid">>(),
        } satisfies IShoppingMallCartItemOption.ICreate,
      },
    );
  typia.assert(cartItemOption);

  // 8. Switch back to admin user
  await api.functional.auth.adminUser.login(connection, {
    body: {
      email: adminUserEmail,
      password_hash: adminUserPassword,
    } satisfies IShoppingMallAdminUser.ILogin,
  });

  // 9. Retrieve the cart item option details as admin user
  const retrievedOption: IShoppingMallCartItemOption =
    await api.functional.shoppingMall.adminUser.cartItems.cartItemOptions.at(
      connection,
      {
        cartItemId: cartItemOption.shopping_cart_item_id,
        cartItemOptionId: cartItemOption.id,
      },
    );
  typia.assert(retrievedOption);

  // 10. Validate that retrieved option matches created option
  TestValidator.equals(
    "cartItemOption id matches",
    retrievedOption.id,
    cartItemOption.id,
  );
  TestValidator.equals(
    "cartItemOption cartItemId matches",
    retrievedOption.shopping_cart_item_id,
    cartItemOption.shopping_cart_item_id,
  );
  TestValidator.equals(
    "cartItemOption optionGroupId matches",
    retrievedOption.shopping_sale_option_group_id,
    cartItemOption.shopping_sale_option_group_id,
  );
  TestValidator.equals(
    "cartItemOption optionId matches",
    retrievedOption.shopping_sale_option_id,
    cartItemOption.shopping_sale_option_id,
  );

  // 11. Validate UUID format of properties
  TestValidator.predicate(
    "cartItemOption id is uuid",
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      retrievedOption.id,
    ),
  );
  TestValidator.predicate(
    "cartItemOption cartItemId is uuid",
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      retrievedOption.shopping_cart_item_id,
    ),
  );
  TestValidator.predicate(
    "cartItemOption optionGroupId is uuid",
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      retrievedOption.shopping_sale_option_group_id,
    ),
  );
  TestValidator.predicate(
    "cartItemOption optionId is uuid",
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      retrievedOption.shopping_sale_option_id,
    ),
  );

  // 12. Test error case: invalid cart item option ID
  await TestValidator.error(
    "invalid cartItemOptionId should fail",
    async () => {
      await api.functional.shoppingMall.adminUser.cartItems.cartItemOptions.at(
        connection,
        {
          cartItemId: cartItemOption.shopping_cart_item_id,
          cartItemOptionId: typia.random<string & tags.Format<"uuid">>(), // random non-existent ID
        },
      );
    },
  );
}
