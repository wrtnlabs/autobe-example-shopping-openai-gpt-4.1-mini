import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallCartItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCartItem";
import type { IShoppingMallCarts } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCarts";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

export async function test_api_cart_add_item_success_with_member_user(
  connection: api.IConnection,
) {
  // 1. Member user creation and authentication
  const memberUserCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(16),
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

  // 2. Create a shopping cart for this member user
  const cartCreateBody = {
    member_user_id: memberUser.id,
    status: "active",
  } satisfies IShoppingMallCarts.ICreate;

  const cart: IShoppingMallCarts =
    await api.functional.shoppingMall.memberUser.carts.createCart(connection, {
      body: cartCreateBody,
    });
  typia.assert(cart);

  // 3. Add a new item to the created cart
  // Generate cart item creation data
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
      {
        cartId: cart.id,
        body: cartItemCreateBody,
      },
    );
  typia.assert(cartItem);

  // Validate returned data matches input ID references and statuses
  TestValidator.equals("cart id matches", cartItem.shopping_cart_id, cart.id);
  TestValidator.equals(
    "cart item status is pending",
    cartItem.status,
    "pending",
  );
  TestValidator.predicate(
    "cart item quantity is positive",
    cartItem.quantity > 0,
  );
  TestValidator.predicate(
    "cart item unit price is positive",
    cartItem.unit_price > 0,
  );
  TestValidator.predicate(
    "cart item has created_at timestamp",
    typeof cartItem.created_at === "string" && cartItem.created_at.length > 0,
  );
  TestValidator.predicate(
    "cart item has updated_at timestamp",
    typeof cartItem.updated_at === "string" && cartItem.updated_at.length > 0,
  );
}
