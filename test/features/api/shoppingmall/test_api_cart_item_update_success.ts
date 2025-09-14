import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallCartItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCartItem";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

export async function test_api_cart_item_update_success(
  connection: api.IConnection,
) {
  // 1. Register a new member user (join) to obtain authentication context.
  const memberUserEmail = typia.random<string & tags.Format<"email">>();
  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: {
        email: memberUserEmail,
        password_hash: "validpassword123",
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        phone_number: null,
        status: "active",
      } satisfies IShoppingMallMemberUser.ICreate,
    });
  typia.assert(memberUser);

  // NOTE: Due to provided assets, explicit cart and cart item creation is unavailable.
  // We use randomly generated UUIDs for cartId and cartItemId as placeholders.
  const cartId = typia.random<string & tags.Format<"uuid">>();
  const cartItemId = typia.random<string & tags.Format<"uuid">>();

  // 2. Prepare update payload for cart item
  const updateBody = {
    quantity: typia.random<number & tags.Type<"int32"> & tags.Minimum<1>>(),
    unit_price: Math.floor(typia.random<number>() * 100000) / 100, // realistic price in range
    status: "pending",
  } satisfies IShoppingMallCartItem.IUpdate;

  // 3. Call the cart item update API
  const updatedCartItem: IShoppingMallCartItem =
    await api.functional.shoppingMall.memberUser.carts.cartItems.update(
      connection,
      {
        cartId,
        cartItemId,
        body: updateBody,
      },
    );
  typia.assert(updatedCartItem);

  // 4. Validate the returned cart item has updated values
  TestValidator.equals(
    "cart item quantity updated",
    updatedCartItem.quantity,
    updateBody.quantity ?? updatedCartItem.quantity,
  );
  TestValidator.equals(
    "cart item unit price updated",
    updatedCartItem.unit_price,
    updateBody.unit_price ?? updatedCartItem.unit_price,
  );
  TestValidator.equals(
    "cart item status updated",
    updatedCartItem.status,
    updateBody.status ?? updatedCartItem.status,
  );
}
