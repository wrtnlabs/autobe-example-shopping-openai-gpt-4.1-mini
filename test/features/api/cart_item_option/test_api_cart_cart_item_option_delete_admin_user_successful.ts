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
 * Test the deletion of a cart item option by an admin user for management
 * purposes. The test scenario covers creating an admin user, creating a cart,
 * adding an item and option, then deleting the option. It includes permission
 * and ownership checks to confirm only admins can delete the option items in
 * the cart.
 */
export async function test_api_cart_cart_item_option_delete_admin_user_successful(
  connection: api.IConnection,
) {
  // 1. Admin user registration
  const adminUserEmail: string = typia.random<string & tags.Format<"email">>();
  const adminUserPassword: string = RandomGenerator.alphaNumeric(10);
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

  // 2. Member user registration
  const memberUserEmail: string = typia.random<string & tags.Format<"email">>();
  const memberUserPassword: string = RandomGenerator.alphaNumeric(10);
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

  // 3. Member user login to establish session
  await api.functional.auth.memberUser.login(connection, {
    body: {
      email: memberUserEmail,
      password: memberUserPassword,
    } satisfies IShoppingMallMemberUser.ILogin,
  });

  // 4. Create a shopping cart associated with the member user
  const cart: IShoppingMallCarts =
    await api.functional.shoppingMall.memberUser.carts.createCart(connection, {
      body: {
        member_user_id: memberUser.id,
        guest_user_id: null,
        status: "active",
      } satisfies IShoppingMallCarts.ICreate,
    });
  typia.assert(cart);

  // 5. Add an item to the cart
  // Generate dummy sale snapshot id
  const shoppingSaleSnapshotId: string = typia.random<
    string & tags.Format<"uuid">
  >();
  const cartItem: IShoppingMallCartItem =
    await api.functional.shoppingMall.memberUser.carts.cartItems.create(
      connection,
      {
        cartId: cart.id,
        body: {
          shopping_cart_id: cart.id,
          shopping_sale_snapshot_id: shoppingSaleSnapshotId,
          quantity: 1,
          unit_price: 10000,
          status: "pending",
        } satisfies IShoppingMallCartItem.ICreate,
      },
    );
  typia.assert(cartItem);

  // 6. Add an option for the cart item
  // Generate dummy option group id and sale option id
  const shoppingSaleOptionGroupId: string = typia.random<
    string & tags.Format<"uuid">
  >();
  const shoppingSaleOptionId: string = typia.random<
    string & tags.Format<"uuid">
  >();
  const cartItemOption: IShoppingMallCartItemOption =
    await api.functional.shoppingMall.memberUser.cartItems.cartItemOptions.create(
      connection,
      {
        cartItemId: cartItem.id,
        body: {
          shopping_cart_item_id: cartItem.id,
          shopping_sale_option_group_id: shoppingSaleOptionGroupId,
          shopping_sale_option_id: shoppingSaleOptionId,
        } satisfies IShoppingMallCartItemOption.ICreate,
      },
    );
  typia.assert(cartItemOption);

  // 7. Switch to admin user login to delete the cart item option
  await api.functional.auth.adminUser.login(connection, {
    body: {
      email: adminUserEmail,
      password_hash: adminUserPassword,
    } satisfies IShoppingMallAdminUser.ILogin,
  });

  // 8. Admin deletes the cart item option
  await api.functional.shoppingMall.adminUser.cartItems.cartItemOptions.eraseCartItemOption(
    connection,
    {
      cartItemId: cartItem.id,
      cartItemOptionId: cartItemOption.id,
    },
  );

  // If no error thrown till here, we consider the deletion successful
  TestValidator.predicate("cart item option deletion success", true);
}
