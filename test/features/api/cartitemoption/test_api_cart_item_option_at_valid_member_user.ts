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
 * End-to-end test validating the full process of a member user creating and
 * retrieving a cart item option.
 *
 * This test simulates a member user joining the platform, creating a
 * shopping cart, adding a cart item, adding a cart item option, and then
 * retrieving that option to verify all associations and data integrity. The
 * workflow demonstrates correct API usage, proper authorization context,
 * and comprehensive type assertion.
 *
 * Test steps:
 *
 * 1. Register a new member user and obtain authentication.
 * 2. Create a new shopping cart for the member user.
 * 3. Add a cart item to the shopping cart using a valid sale snapshot ID.
 * 4. Add a cart item option linked to the created cart item.
 * 5. Retrieve the cart item option by ID.
 * 6. Validate the retrieved data against creation responses for consistency
 *    and type safety.
 *
 * All IDs and timestamps are verified for UUID and date-time compliance,
 * leveraging typia.assert.
 */
export async function test_api_cart_item_option_at_valid_member_user(
  connection: api.IConnection,
) {
  // 1. Member user registration
  const userEmail: string = typia.random<string & tags.Format<"email">>();
  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: {
        email: userEmail,
        password_hash: RandomGenerator.alphaNumeric(16),
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(2),
        phone_number: null,
        status: "active",
      } satisfies IShoppingMallMemberUser.ICreate,
    });
  typia.assert(memberUser);

  // 2. Create shopping cart for member user
  const shoppingCart: IShoppingMallCarts =
    await api.functional.shoppingMall.memberUser.carts.createCart(connection, {
      body: {
        member_user_id: memberUser.id,
        status: "active",
        guest_user_id: null,
      } satisfies IShoppingMallCarts.ICreate,
    });
  typia.assert(shoppingCart);

  // 3. Add a cart item to the shopping cart
  // We need to mock a valid shopping_sale_snapshot_id,
  // since no API for sale snapshots provided, generate a UUID
  const shoppingSaleSnapshotId: string = typia.random<
    string & tags.Format<"uuid">
  >();
  const cartItemCreateBody = {
    shopping_cart_id: shoppingCart.id,
    shopping_sale_snapshot_id: shoppingSaleSnapshotId,
    quantity: 1,
    unit_price: 100,
    status: "active",
    deleted_at: null,
    created_at: undefined,
    updated_at: undefined,
  }; // For optional timestamps, omit or undefined is legal

  const cartItem: IShoppingMallCartItem =
    await api.functional.shoppingMall.memberUser.carts.cartItems.create(
      connection,
      {
        cartId: shoppingCart.id,
        body: cartItemCreateBody satisfies IShoppingMallCartItem.ICreate,
      },
    );
  typia.assert(cartItem);

  // 4. Add a cart item option to the newly created cart item
  // Again, no API for sale option group and sale option, generate UUIDs
  const optionGroupId: string = typia.random<string & tags.Format<"uuid">>();
  const saleOptionId: string = typia.random<string & tags.Format<"uuid">>();

  const cartItemOptionCreateBody = {
    shopping_cart_item_id: cartItem.id,
    shopping_sale_option_group_id: optionGroupId,
    shopping_sale_option_id: saleOptionId,
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

  // 5. Retrieve the cart item option by id
  const optionInfo: IShoppingMallCartItemOption =
    await api.functional.shoppingMall.memberUser.cartItems.cartItemOptions.at(
      connection,
      {
        cartItemId: cartItem.id,
        cartItemOptionId: cartItemOption.id,
      },
    );
  typia.assert(optionInfo);

  // 6. Validate returned data fields and correctness
  TestValidator.equals(
    "cart item option id matches created",
    optionInfo.id,
    cartItemOption.id,
  );
  TestValidator.equals(
    "cart item option cart item id matches",
    optionInfo.shopping_cart_item_id,
    cartItem.id,
  );
  TestValidator.equals(
    "cart item option group id matches",
    optionInfo.shopping_sale_option_group_id,
    optionGroupId,
  );
  TestValidator.equals(
    "cart item sale option id matches",
    optionInfo.shopping_sale_option_id,
    saleOptionId,
  );

  // Additional check: timestamps are ISO date strings
  TestValidator.predicate(
    "option created_at is ISO date-time",
    !isNaN(Date.parse(optionInfo.created_at)),
  );
  TestValidator.predicate(
    "option updated_at is ISO date-time",
    !isNaN(Date.parse(optionInfo.updated_at)),
  );
}
