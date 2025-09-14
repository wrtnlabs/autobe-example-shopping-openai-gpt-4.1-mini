import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallCartItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCartItem";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * E2E test function for creating a shopping cart item by a member user.
 *
 * This test covers:
 *
 * 1. Member user creation and authentication.
 * 2. Creation of a cart item with valid request body.
 * 3. Validation of API response correctness and type.
 * 4. Error scenario when using invalid cart ID.
 */
export async function test_api_cart_item_create_success(
  connection: api.IConnection,
) {
  // Create a new member user
  const userCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(12),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: null,
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;

  const authorizedUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: userCreateBody,
    });
  typia.assert(authorizedUser);

  // Prepare cart item creation data
  const cartId = typia.random<string & tags.Format<"uuid">>();
  const shoppingSaleSnapshotId = typia.random<string & tags.Format<"uuid">>();
  const quantity = typia.random<
    number & tags.Type<"int32"> & tags.Minimum<1>
  >();
  const unitPrice = Number((Math.random() * 1000 + 10).toFixed(2));

  const cartItemCreateBody = {
    shopping_cart_id: cartId,
    shopping_sale_snapshot_id: shoppingSaleSnapshotId,
    quantity: quantity,
    unit_price: unitPrice,
    status: "pending",
  } satisfies IShoppingMallCartItem.ICreate;

  // Create cart item
  const createdCartItem: IShoppingMallCartItem =
    await api.functional.shoppingMall.memberUser.carts.cartItems.create(
      connection,
      {
        cartId: cartId,
        body: cartItemCreateBody,
      },
    );
  typia.assert(createdCartItem);

  // Validate that the response matches input
  TestValidator.equals(
    "shopping_cart_id matches",
    createdCartItem.shopping_cart_id,
    cartItemCreateBody.shopping_cart_id,
  );
  TestValidator.equals(
    "shopping_sale_snapshot_id matches",
    createdCartItem.shopping_sale_snapshot_id,
    cartItemCreateBody.shopping_sale_snapshot_id,
  );
  TestValidator.equals(
    "quantity matches",
    createdCartItem.quantity,
    cartItemCreateBody.quantity,
  );
  TestValidator.equals(
    "unit_price matches",
    createdCartItem.unit_price,
    cartItemCreateBody.unit_price,
  );
  TestValidator.equals(
    "status matches",
    createdCartItem.status,
    cartItemCreateBody.status,
  );

  // Test error case: invalid cart ID
  await TestValidator.error("error on invalid cart id", async () => {
    const invalidCartId = typia.random<string & tags.Format<"uuid">>();
    await api.functional.shoppingMall.memberUser.carts.cartItems.create(
      connection,
      {
        cartId: invalidCartId,
        body: {
          ...cartItemCreateBody,
          shopping_cart_id: invalidCartId,
        },
      },
    );
  });
}
