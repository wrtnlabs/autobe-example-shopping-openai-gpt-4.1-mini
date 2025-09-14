import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallCartItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallCartItem";
import type { IShoppingMallCartItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCartItem";
import type { IShoppingMallCarts } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCarts";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * Test retrieval of paginated and filtered list of cart items within a
 * member user's cart.
 *
 * This test performs the following steps:
 *
 * 1. Creates a member user and authenticates to establish authorization.
 * 2. Creates a shopping cart linked to the authenticated member user.
 * 3. Creates multiple cart items under the cart with various statuses.
 * 4. Retrieves the list of cart items using filtering (by status), pagination,
 *    and sorting.
 * 5. Validates the response structure, contents, and behavior.
 * 6. Tests failure scenarios including unauthorized access and invalid cart
 *    ID.
 *
 * The test uses DTO types for member user creation, cart creation, cart
 * item creation, and listing. It leverages typia.random and RandomGenerator
 * to generate valid test data respecting format and business constraints.
 * All API responses are validated using typia.assert. TestValidator
 * functions ensure expected logical validations and error handling.
 */
export async function test_api_cart_items_list_memberuser_authenticated_success_and_auth_failure(
  connection: api.IConnection,
) {
  // 1. Member user creation (join) and authentication
  const memberUserCreation = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: "password123!", // simplified plain password as hash for test
    nickname: RandomGenerator.name(2),
    full_name: RandomGenerator.name(3),
    phone_number: RandomGenerator.mobile(),
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;
  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: memberUserCreation,
    });
  typia.assert(memberUser);

  // 2. Create a shopping cart linked to the member user
  const cartCreationBody = {
    member_user_id: memberUser.id,
    status: "active",
  } satisfies IShoppingMallCarts.ICreate;
  const cart: IShoppingMallCarts =
    await api.functional.shoppingMall.memberUser.carts.createCart(connection, {
      body: cartCreationBody,
    });
  typia.assert(cart);
  TestValidator.equals(
    "Cart member_user_id should match member user",
    cart.member_user_id,
    memberUser.id,
  );

  // 3. Create multiple cart items with varying statuses
  const itemStatuses = ["pending", "ordered", "cancelled"] as const;
  const createdCartItems: IShoppingMallCartItem[] = [];
  const itemCount = 5;
  for (let i = 0; i < itemCount; ++i) {
    const shoppingSaleSnapshotId = typia.random<string & tags.Format<"uuid">>();
    const quantity = 1 + (i % 3); // 1 to 3
    const cartItemBody = {
      shopping_cart_id: cart.id,
      shopping_sale_snapshot_id: shoppingSaleSnapshotId,
      quantity: quantity,
      unit_price: 10000 + i * 1000,
      status: itemStatuses[i % itemStatuses.length],
    } satisfies IShoppingMallCartItem.ICreate;

    const createdItem: IShoppingMallCartItem =
      await api.functional.shoppingMall.memberUser.carts.cartItems.create(
        connection,
        {
          cartId: cart.id,
          body: cartItemBody,
        },
      );
    typia.assert(createdItem);
    TestValidator.equals(
      "Cart item cartId should match",
      createdItem.shopping_cart_id,
      cart.id,
    );
    TestValidator.equals(
      "Cart item status should match",
      createdItem.status,
      cartItemBody.status,
    );
    createdCartItems.push(createdItem);
  }

  // 4. Retrieve cart items list with filtering and pagination
  const filterStatus = "ordered";
  const requestBody = {
    status: filterStatus,
    page: 1,
    limit: 3,
    orderBy: "created_at desc",
  } satisfies IShoppingMallCartItem.IRequest;

  const paginatedResult: IPageIShoppingMallCartItem =
    await api.functional.shoppingMall.memberUser.carts.cartItems.index(
      connection,
      {
        cartId: cart.id,
        body: requestBody,
      },
    );
  typia.assert(paginatedResult);

  TestValidator.predicate(
    "Filtered result items have requested status",
    paginatedResult.data.every((item) => item.status === filterStatus),
  );
  TestValidator.predicate(
    "Pagination limit is respected",
    paginatedResult.data.length <= 3,
  );
  TestValidator.equals(
    "Pagination page number should be 1",
    paginatedResult.pagination.current,
    1,
  );
  TestValidator.equals(
    "Pagination limit should be 3",
    paginatedResult.pagination.limit,
    3,
  );
  TestValidator.predicate(
    "All paginated items belong to the correct cart",
    paginatedResult.data.every((item) => item.shopping_cart_id === cart.id),
  );

  // 5. Test unauthorized access (no token)
  const unauthenticatedConnection: api.IConnection = {
    ...connection,
    headers: {},
  };
  await TestValidator.error(
    "Unauthenticated access should be rejected",
    async () => {
      await api.functional.shoppingMall.memberUser.carts.cartItems.index(
        unauthenticatedConnection,
        {
          cartId: cart.id,
          body: requestBody,
        },
      );
    },
  );

  // 6. Test invalid cart ID
  await TestValidator.error("Invalid cartId should cause error", async () => {
    await api.functional.shoppingMall.memberUser.carts.cartItems.index(
      connection,
      {
        cartId: typia.random<string & tags.Format<"uuid">>(), // random unrelated UUID
        body: requestBody,
      },
    );
  });
}
