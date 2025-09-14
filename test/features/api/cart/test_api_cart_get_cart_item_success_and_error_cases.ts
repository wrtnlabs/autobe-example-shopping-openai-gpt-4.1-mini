import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallCartItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCartItem";

export async function test_api_cart_get_cart_item_success_and_error_cases(
  connection: api.IConnection,
) {
  // 1. Create admin user and authenticate
  const adminUserEmail: string = typia.random<string & tags.Format<"email">>();
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: adminUserEmail,
        password_hash: "hashed_password_1234",
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // 2. Prepare valid cartId and cartItemId for successful retrieval
  // As the scenario and provided API do not describe create or list for carts or cart items,
  // we use typia.random to generate valid UUIDs for demonstration.
  // In realistic scenario, IDs would come from creates or listings beforehand.

  const validCartId = typia.random<string & tags.Format<"uuid">>();
  const validCartItemId = typia.random<string & tags.Format<"uuid">>();

  // 3. Success case: Retrieve existing cart item
  const cartItem: IShoppingMallCartItem =
    await api.functional.shoppingMall.adminUser.carts.cartItems.at(connection, {
      cartId: validCartId,
      cartItemId: validCartItemId,
    });
  typia.assert(cartItem);

  TestValidator.equals(
    "retrieved cart item id matches expected",
    cartItem.id,
    validCartItemId,
  );
  TestValidator.equals(
    "retrieved cart item cart id matches expected",
    cartItem.shopping_cart_id,
    validCartId,
  );
  TestValidator.predicate(
    "retrieved cart item quantity is positive",
    cartItem.quantity > 0,
  );
  TestValidator.predicate(
    "retrieved cart item unit price is positive",
    cartItem.unit_price > 0,
  );
  TestValidator.predicate(
    "retrieved cart item has valid status",
    cartItem.status === "pending" ||
      cartItem.status === "ordered" ||
      cartItem.status === "cancelled",
  );

  // 4. Error case: non-existent cartId
  // Use a new random UUID assuming it does not exist
  const nonExistentCartId = typia.random<string & tags.Format<"uuid">>();
  await TestValidator.error(
    "retrieve cart item with non-existent cartId should fail",
    async () => {
      await api.functional.shoppingMall.adminUser.carts.cartItems.at(
        connection,
        {
          cartId: nonExistentCartId,
          cartItemId: validCartItemId,
        },
      );
    },
  );

  // 5. Error case: valid cartId but non-existent cartItemId
  const nonExistentCartItemId = typia.random<string & tags.Format<"uuid">>();
  await TestValidator.error(
    "retrieve cart item with non-existent cartItemId should fail",
    async () => {
      await api.functional.shoppingMall.adminUser.carts.cartItems.at(
        connection,
        {
          cartId: validCartId,
          cartItemId: nonExistentCartItemId,
        },
      );
    },
  );
}
