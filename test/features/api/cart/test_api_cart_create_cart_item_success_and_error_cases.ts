import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallCartItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCartItem";

/**
 * This test validates creating a cart item in the shopping mall platform with
 * authenticated admin user.
 *
 * Steps involved:
 *
 * 1. Create and authenticate an admin user.
 * 2. Create a cart item with all required valid data.
 * 3. Validate the created cart item's properties.
 * 4. Test unauthenticated creation failure.
 * 5. Test creation failure with an invalid cart ID.
 */
export async function test_api_cart_create_cart_item_success_and_error_cases(
  connection: api.IConnection,
) {
  // 1. Create admin user and authenticate
  const adminUserEmail: string = typia.random<string & tags.Format<"email">>();
  const adminUserCreate = {
    email: adminUserEmail,
    password_hash: RandomGenerator.alphaNumeric(32),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const authorizedAdminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminUserCreate,
    });
  typia.assert(authorizedAdminUser);

  // 2. Create valid cart item
  const validCartItemCreate = {
    shopping_cart_id: typia.random<string & tags.Format<"uuid">>(),
    shopping_sale_snapshot_id: typia.random<string & tags.Format<"uuid">>(),
    quantity: typia.random<number & tags.Type<"int32"> & tags.Minimum<1>>(),
    unit_price: typia.random<
      number & tags.Minimum<100> & tags.Maximum<10000>
    >(),
    status: "pending",
  } satisfies IShoppingMallCartItem.ICreate;

  const createdCartItem: IShoppingMallCartItem =
    await api.functional.shoppingMall.adminUser.carts.cartItems.create(
      connection,
      {
        cartId: validCartItemCreate.shopping_cart_id,
        body: validCartItemCreate,
      },
    );
  typia.assert(createdCartItem);

  TestValidator.predicate(
    "created cart item id UUID check",
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      createdCartItem.id,
    ),
  );
  TestValidator.equals(
    "shopping_cart_id same",
    createdCartItem.shopping_cart_id,
    validCartItemCreate.shopping_cart_id,
  );
  TestValidator.equals(
    "shopping_sale_snapshot_id same",
    createdCartItem.shopping_sale_snapshot_id,
    validCartItemCreate.shopping_sale_snapshot_id,
  );
  TestValidator.equals(
    "quantity same",
    createdCartItem.quantity,
    validCartItemCreate.quantity,
  );
  TestValidator.equals(
    "unit_price same",
    createdCartItem.unit_price,
    validCartItemCreate.unit_price,
  );
  TestValidator.equals("status same", createdCartItem.status, "pending");

  // 3. Error test: Unauthenticated create
  const unauthenticatedConnection: api.IConnection = {
    ...connection,
    headers: {},
  };
  await TestValidator.error("unauthenticated create should fail", async () => {
    await api.functional.shoppingMall.adminUser.carts.cartItems.create(
      unauthenticatedConnection,
      {
        cartId: validCartItemCreate.shopping_cart_id,
        body: validCartItemCreate,
      },
    );
  });

  // 4. Error test: Invalid cartId create
  await TestValidator.error(
    "create cart item invalid cartId should fail",
    async () => {
      await api.functional.shoppingMall.adminUser.carts.cartItems.create(
        connection,
        {
          cartId: "00000000-0000-0000-0000-000000000000",
          body: validCartItemCreate,
        },
      );
    },
  );
}
