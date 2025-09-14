import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallCartItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallCartItem";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallCartItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCartItem";
import type { IShoppingMallCarts } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCarts";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * This test validates the admin user's ability to retrieve a filtered and
 * paginated list of cart items for a specific cart. It covers authentication
 * for admin and member users, creates a cart for the member user, adds items,
 * then verifies that the admin user can successfully list those items. The test
 * also includes negative tests for invalid cart ID formats and unauthorized
 * access attempts.
 */
export async function test_api_cart_items_list_adminuser_authorization_and_data_retrieval(
  connection: api.IConnection,
) {
  // 1. Create and authenticate admin user
  const adminEmail = typia.random<string & tags.Format<"email">>();
  const adminCreateBody = {
    email: adminEmail,
    password_hash: "StrongPass#123",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminCreateBody,
    });
  typia.assert(adminUser);

  // Login admin user explicitly to refresh authentication context
  const adminLoginBody = {
    email: adminEmail,
    password_hash: "StrongPass#123",
  } satisfies IShoppingMallAdminUser.ILogin;
  const adminLogin: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.login(connection, {
      body: adminLoginBody,
    });
  typia.assert(adminLogin);

  // 2. Create and authenticate member user
  const memberEmail = typia.random<string & tags.Format<"email">>();
  const memberCreateBody = {
    email: memberEmail,
    password_hash: "StrongPass#123",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: RandomGenerator.mobile(),
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;
  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: memberCreateBody,
    });
  typia.assert(memberUser);

  // Login member user explicitly
  const memberLoginBody = {
    email: memberEmail,
    password: "StrongPass#123",
  } satisfies IShoppingMallMemberUser.ILogin;
  const memberLogin: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.login(connection, {
      body: memberLoginBody,
    });
  typia.assert(memberLogin);

  // 3. Create a shopping cart linked to this member user
  const cartCreateBody = {
    member_user_id: memberUser.id,
    status: "active",
  } satisfies IShoppingMallCarts.ICreate;
  const shoppingCart: IShoppingMallCarts =
    await api.functional.shoppingMall.memberUser.carts.createCart(connection, {
      body: cartCreateBody,
    });
  typia.assert(shoppingCart);
  TestValidator.equals(
    "shoppingCart member_user_id matches",
    shoppingCart.member_user_id,
    memberUser.id,
  );

  // 4. Create multiple cart items in this cart
  const cartItemCount = 3;
  const createdCartItems: IShoppingMallCartItem[] = [];
  for (let i = 0; i < cartItemCount; i++) {
    const cartItemCreateBody = {
      shopping_cart_id: shoppingCart.id,
      shopping_sale_snapshot_id: typia.random<string & tags.Format<"uuid">>(),
      quantity: typia.random<
        number & tags.Type<"int32"> & tags.Minimum<1>
      >() satisfies number as number,
      unit_price: Math.floor(Math.random() * 10000) + 1000,
      status: "pending",
    } satisfies IShoppingMallCartItem.ICreate;
    const cartItem: IShoppingMallCartItem =
      await api.functional.shoppingMall.memberUser.carts.cartItems.create(
        connection,
        {
          cartId: shoppingCart.id,
          body: cartItemCreateBody,
        },
      );
    typia.assert(cartItem);
    createdCartItems.push(cartItem);
  }

  // 5. Switch authentication back to admin user
  await api.functional.auth.adminUser.login(connection, {
    body: adminLoginBody,
  });

  // 6. Retrieve the list of cart items as admin user with valid filtering and pagination
  const listRequestBody = {
    status: "pending",
    page: 1,
    limit: 10,
    orderBy: "created_at desc",
  } satisfies IShoppingMallCartItem.IRequest;

  const cartItemListResponse: IPageIShoppingMallCartItem =
    await api.functional.shoppingMall.adminUser.carts.cartItems.index(
      connection,
      {
        cartId: shoppingCart.id satisfies string & tags.Format<"uuid">,
        body: listRequestBody,
      },
    );
  typia.assert(cartItemListResponse);

  // Validate pagination correctness
  TestValidator.predicate(
    "pagination current page matches",
    cartItemListResponse.pagination.current === listRequestBody.page,
  );
  TestValidator.predicate(
    "pagination page size equals limit",
    cartItemListResponse.pagination.limit === listRequestBody.limit,
  );
  TestValidator.predicate(
    "pagination record count non-negative",
    cartItemListResponse.pagination.records >= 0,
  );
  TestValidator.predicate(
    "pagination pages count correct",
    cartItemListResponse.pagination.pages >= 0,
  );

  // Validate returned cart items belong to the correct cart and match filter
  TestValidator.predicate(
    "all returned cart items have the tested cart ID",
    cartItemListResponse.data.every(
      (item) => item.shopping_cart_id === shoppingCart.id,
    ),
  );
  TestValidator.predicate(
    "all returned cart items have status 'pending'",
    cartItemListResponse.data.every((item) => item.status === "pending"),
  );

  // 7. Negative test: Use invalid cartId format (non-UUID) and expect error
  await TestValidator.error(
    "invalid cart ID format should reject",
    async () => {
      await api.functional.shoppingMall.adminUser.carts.cartItems.index(
        connection,
        {
          cartId: "invalid-cart-id",
          body: {
            status: "pending",
            page: 1,
            limit: 5,
            orderBy: "created_at desc",
          } satisfies IShoppingMallCartItem.IRequest,
        },
      );
    },
  );

  // 8. Negative test: Switch to member user and attempt to list cart items - expect authorization error
  await api.functional.auth.memberUser.login(connection, {
    body: memberLoginBody,
  });
  await TestValidator.error(
    "member user attempting to list admin cart items should fail",
    async () => {
      await api.functional.shoppingMall.adminUser.carts.cartItems.index(
        connection,
        {
          cartId: shoppingCart.id,
          body: {
            status: "pending",
            page: 1,
            limit: 5,
            orderBy: "created_at desc",
          } satisfies IShoppingMallCartItem.IRequest,
        },
      );
    },
  );
}
