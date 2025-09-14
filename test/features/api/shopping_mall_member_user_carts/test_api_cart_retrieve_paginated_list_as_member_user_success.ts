import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallCarts } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallCarts";
import type { IShoppingMallCarts } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCarts";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * Test retrieving paginated list of shopping carts for authenticated member
 * user with filtering by status and pagination parameters.
 *
 * This test verifies that after creating a member user and acquiring an
 * authentication token, the user can retrieve their shopping carts using
 * the PATCH /shoppingMall/memberUser/carts endpoint. It validates
 * pagination metadata, ensures all carts belong to the authenticated member
 * user, and are filtered by status "active".
 *
 * Steps:
 *
 * 1. Create member user and authenticate via /auth/memberUser/join
 * 2. Retrieve paginated cart list for that member user with status filter
 *    "active"
 * 3. Assert response structure and data consistency
 */
export async function test_api_cart_retrieve_paginated_list_as_member_user_success(
  connection: api.IConnection,
) {
  // 1. Member user creation and join to obtain authorization token
  const memberUserCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(16),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: undefined,
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;

  const authorizedUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: memberUserCreateBody,
    });
  typia.assert(authorizedUser);

  // 2. Retrieve paginated carts list for authenticated member user, filtering by status and pagination params
  const requestBody = {
    member_user_id: authorizedUser.id,
    status: "active",
    page: 1,
    limit: 10,
  } satisfies IShoppingMallCarts.IRequest;

  const pageResult: IPageIShoppingMallCarts.ISummary =
    await api.functional.shoppingMall.memberUser.carts.searchCarts(connection, {
      body: requestBody,
    });
  typia.assert(pageResult);

  // 3. Validate pagination info
  TestValidator.predicate(
    "pagination current page should be 1",
    pageResult.pagination.current === 1,
  );
  TestValidator.predicate(
    "pagination limit should be 10",
    pageResult.pagination.limit === 10,
  );

  // 4. Validate each cart that it belongs to the authorized member user and has the status "active"
  for (const cart of pageResult.data) {
    typia.assert(cart);
    TestValidator.equals(
      "cart member_user_id matches authorized user",
      cart.member_user_id ?? null,
      authorizedUser.id,
    );
    TestValidator.equals("cart status is active", cart.status, "active");
  }
}
