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
 * E2E test verifying that unauthorized access to the shopping carts
 * retrieval API fails as expected.
 *
 * This test covers the PATCH /shoppingMall/memberUser/carts endpoint which
 * requires 'memberUser' authorization. It first performs a memberUser join
 * operation to simulate user registration and token issuance. Then, it
 * attempts to perform a cart search operation using an unauthenticated
 * connection (cleared headers).
 *
 * The test verifies that the searchCarts API rejects requests from
 * unauthorized users by expecting errors on the unauthenticated API call.
 *
 * Request filtering parameters are randomized but valid, including status
 * filters, pagination settings, and sorting orders.
 */
export async function test_api_cart_retrieve_paginated_list_unauthorized_failure(
  connection: api.IConnection,
) {
  // 1. Perform the mandatory memberUser join to acquire authorization context
  const authorizedUser = await api.functional.auth.memberUser.join(connection, {
    body: {
      email: typia.random<string & tags.Format<"email">>(),
      password_hash: RandomGenerator.alphaNumeric(12),
      nickname: RandomGenerator.name(),
      full_name: RandomGenerator.name(2),
      phone_number: null,
      status: "active",
    } satisfies IShoppingMallMemberUser.ICreate,
  });
  typia.assert(authorizedUser);

  // 2. Create an unauthenticated connection by clearing headers
  const unauthConn: api.IConnection = { ...connection, headers: {} };

  // 3. Prepare a valid request body with random filters and pagination
  const requestBody = {
    status: RandomGenerator.pick(["active", "inactive"] as const),
    guest_user_id: null,
    member_user_id: authorizedUser.id,
    page: 1,
    limit: 10,
    orderBy: "created_at desc",
  } satisfies IShoppingMallCarts.IRequest;

  // 4. Attempt to call searchCarts with unauthenticated connection expecting error
  await TestValidator.error(
    "unauthorized access with no authentication should fail",
    async () => {
      await api.functional.shoppingMall.memberUser.carts.searchCarts(
        unauthConn,
        { body: requestBody },
      );
    },
  );
}
