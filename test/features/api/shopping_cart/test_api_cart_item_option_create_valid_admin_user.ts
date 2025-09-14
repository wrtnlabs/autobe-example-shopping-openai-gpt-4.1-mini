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
 * Validate admin user's ability to create a new cart item option attached to a
 * member user's cart item. This involves multi-actor authentication handling,
 * creation of related member user cart and cart items, followed by admin user
 * performing the cart item option creation operation. The test verifies proper
 * response data integrity and correct linkage of option groups and options to
 * cart items.
 */
export async function test_api_cart_item_option_create_valid_admin_user(
  connection: api.IConnection,
) {
  // 1. Create an admin user
  const adminUserEmail = typia.random<string & tags.Format<"email">>();
  const adminUserPassword = "P@ssw0rd1234";
  const adminUserJoinBody = {
    email: adminUserEmail,
    password_hash: adminUserPassword,
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminUserJoinBody,
    });
  typia.assert(adminUser);

  // 2. Admin user login
  await api.functional.auth.adminUser.login(connection, {
    body: {
      email: adminUserEmail,
      password_hash: adminUserPassword,
    } satisfies IShoppingMallAdminUser.ILogin,
  });

  // 3. Create a member user
  const memberUserEmail = typia.random<string & tags.Format<"email">>();
  const memberUserPassword = "MemBer2025$";
  const memberUserJoinBody = {
    email: memberUserEmail,
    password_hash: memberUserPassword,
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    phone_number: RandomGenerator.mobile(),
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;
  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: memberUserJoinBody,
    });
  typia.assert(memberUser);

  // 4. Member user login
  await api.functional.auth.memberUser.login(connection, {
    body: {
      email: memberUserEmail,
      password: memberUserPassword,
    } satisfies IShoppingMallMemberUser.ILogin,
  });

  // 5. Create a shopping cart for member user
  const cartCreateBody = {
    member_user_id: memberUser.id,
    status: "active",
  } satisfies IShoppingMallCarts.ICreate;
  const cart: IShoppingMallCarts =
    await api.functional.shoppingMall.memberUser.carts.createCart(connection, {
      body: cartCreateBody,
    });
  typia.assert(cart);

  // 6. Add a cart item to the cart
  const cartItemCreateBody = {
    shopping_cart_id: cart.id,
    shopping_sale_snapshot_id: typia.random<string & tags.Format<"uuid">>(),
    quantity: typia.random<number & tags.Type<"int32"> & tags.Minimum<1>>(),
    unit_price: 1000,
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

  // 7. Admin user re-login to ensure correct token for admin operations
  await api.functional.auth.adminUser.login(connection, {
    body: {
      email: adminUserEmail,
      password_hash: adminUserPassword,
    } satisfies IShoppingMallAdminUser.ILogin,
  });

  // 8. Create a cart item option linked to the cart item
  const optionGroupId = typia.random<string & tags.Format<"uuid">>();
  const optionId = typia.random<string & tags.Format<"uuid">>();
  const cartItemOptionCreateBody = {
    shopping_cart_item_id: cartItem.id,
    shopping_sale_option_group_id: optionGroupId,
    shopping_sale_option_id: optionId,
  } satisfies IShoppingMallCartItemOption.ICreate;

  const cartItemOption: IShoppingMallCartItemOption =
    await api.functional.shoppingMall.adminUser.cartItems.cartItemOptions.create(
      connection,
      {
        cartItemId: cartItem.id,
        body: cartItemOptionCreateBody,
      },
    );
  typia.assert(cartItemOption);

  // 9. Validate the created cart item option matches the request
  TestValidator.equals(
    "cartItemOption.shopping_cart_item_id matches request",
    cartItemOption.shopping_cart_item_id,
    cartItemOptionCreateBody.shopping_cart_item_id,
  );
  TestValidator.equals(
    "cartItemOption.shopping_sale_option_group_id matches request",
    cartItemOption.shopping_sale_option_group_id,
    cartItemOptionCreateBody.shopping_sale_option_group_id,
  );
  TestValidator.equals(
    "cartItemOption.shopping_sale_option_id matches request",
    cartItemOption.shopping_sale_option_id,
    cartItemOptionCreateBody.shopping_sale_option_id,
  );

  // Basic validation of UUID format for id and timestamps
  TestValidator.predicate(
    "cartItemOption.id is UUID string",
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      cartItemOption.id,
    ),
  );
  TestValidator.predicate(
    "cartItemOption.created_at is ISO date-time string",
    typeof cartItemOption.created_at === "string" &&
      !isNaN(Date.parse(cartItemOption.created_at)),
  );
  TestValidator.predicate(
    "cartItemOption.updated_at is ISO date-time string",
    typeof cartItemOption.updated_at === "string" &&
      !isNaN(Date.parse(cartItemOption.updated_at)),
  );
}
