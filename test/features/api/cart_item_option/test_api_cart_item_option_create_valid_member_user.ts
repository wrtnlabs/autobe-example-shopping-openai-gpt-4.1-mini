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
 * This test fully validates the business workflow of a member user successfully
 * creating a cart, adding a cart item, and then adding a cart item option to
 * that specific cart item by providing the necessary references to the shopping
 * cart item and the related option group and sale option identifiers. The test
 * checks for correct persistence of data and that the returned response matches
 * the expected structure and values. The test scenario does not implement
 * invalid type tests or unauthorized attempts as per the instructions but
 * focuses on the happy path of valid member user operations. The test also
 * confirms that creation of member user and shopping cart and cart items
 * dependencies are executed before the main test. The flow is as follows:
 *
 * 1. Create a new member user by calling the join endpoint with valid user
 *    creation data.
 * 2. Create a new shopping cart for the newly created member user.
 * 3. Add a new cart item to the created cart, providing realistic random values
 *    for snapshot id, quantity, price and status.
 * 4. Add a new cart item option to this cart item by specifying the cart item id
 *    and randomly generated but valid values for shopping_sale_option_group_id
 *    and shopping_sale_option_id.
 * 5. Validate every API response with typia.assert and assert business-relevant
 *    properties such as id matches and associations are correct.
 * 6. No invalid data or error tests are implemented because they violate the type
 *    safety requirements.
 * 7. The test uses only available SDK functions and DTO structures and complies
 *    strictly with all constraints such as required properties, null vs
 *    undefined, and formatting.
 * 8. Random values for ids with uuid format are generated using
 *    typia.random<string & tags.Format<"uuid">>(), quantities and prices with
 *    proper types.
 *
 * This comprehensive test demonstrates the flow of member user cart item option
 * creation and verifies the functional correctness of the API endpoints
 * involved.
 */
export async function test_api_cart_item_option_create_valid_member_user(
  connection: api.IConnection,
) {
  // 1. Create a new member user by calling join endpoint
  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: {
        email: RandomGenerator.alphaNumeric(8) + "@example.com",
        password_hash: "valid_password_hash",
        nickname: RandomGenerator.name(1),
        full_name: RandomGenerator.name(2),
        phone_number: null,
        status: "ACTIVE",
      } satisfies IShoppingMallMemberUser.ICreate,
    });
  typia.assert(memberUser);

  // 2. Create a shopping cart for the newly created member user
  const cart: IShoppingMallCarts =
    await api.functional.shoppingMall.memberUser.carts.createCart(connection, {
      body: {
        member_user_id: memberUser.id,
        status: "ACTIVE",
        guest_user_id: null,
      } satisfies IShoppingMallCarts.ICreate,
    });
  typia.assert(cart);

  // 3. Add a cart item to the created cart
  const cartItemCreateBody = {
    shopping_cart_id: cart.id,
    shopping_sale_snapshot_id: typia.random<string & tags.Format<"uuid">>(),
    quantity: 1,
    unit_price: 10000,
    status: "PENDING",
    deleted_at: null,
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

  // 4. Add a cart item option to this cart item
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

  // 5. Validate associations
  TestValidator.equals(
    "cart item option is linked to the cart item",
    cartItemOption.shopping_cart_item_id,
    cartItem.id,
  );
  TestValidator.predicate(
    "cart item option has valid option group ID",
    typeof cartItemOption.shopping_sale_option_group_id === "string" &&
      cartItemOption.shopping_sale_option_group_id.length > 0,
  );
  TestValidator.predicate(
    "cart item option has valid option ID",
    typeof cartItemOption.shopping_sale_option_id === "string" &&
      cartItemOption.shopping_sale_option_id.length > 0,
  );
}
