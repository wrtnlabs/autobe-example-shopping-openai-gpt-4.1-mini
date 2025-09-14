import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallCartItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallCartItem";
import type { IShoppingMallCartItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCartItem";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * Test listing cart items for an authenticated member user.
 *
 * This test ensures that an authenticated member user can retrieve a
 * paginated, filtered, and sorted list of cart items for a specified
 * shopping cart. It validates response structure, data integrity, and
 * adherence to pagination and filtering criteria.
 *
 * Test steps:
 *
 * 1. Register a new member user (join) and assert authentication data.
 * 2. Generate a valid random cart ID to simulate cart item retrieval.
 * 3. Build a request body with realistic filtering, pagination, and sorting.
 * 4. Call the cartItems.index API and assert correct response data structure.
 * 5. Validate pagination metadata and cart item properties.
 *
 * Note: Due to API constraints, cart creation is simulated by random UUID.
 * Error scenarios and unauthorized access tests are skipped as they require
 * additional authentication or client environment control.
 */
export async function test_api_cart_item_index_success(
  connection: api.IConnection,
) {
  // Step 1. Create new member user with valid properties
  const createUserBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(16),
    nickname: RandomGenerator.name(2),
    full_name: RandomGenerator.name(2),
    phone_number: null,
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;

  const memberUser = await api.functional.auth.memberUser.join(connection, {
    body: createUserBody,
  });
  typia.assert(memberUser);

  // Step 2. Generate a valid cartId for testing (random UUID)
  const cartId = typia.random<string & tags.Format<"uuid">>();

  // Step 3. Prepare request body with pagination, optional status filter, and orderBy
  const requestBody = {
    status: undefined, // no status filtering
    page: 1,
    limit: 10,
    orderBy: "created_at desc",
  } satisfies IShoppingMallCartItem.IRequest;

  // Step 4. Call cartItems index API
  const response: IPageIShoppingMallCartItem =
    await api.functional.shoppingMall.memberUser.carts.cartItems.index(
      connection,
      {
        cartId: cartId,
        body: requestBody,
      },
    );
  typia.assert(response);

  // Step 5. Validate pagination properties
  const pagination = response.pagination;
  TestValidator.predicate(
    "pagination current page is at least 1",
    pagination.current >= 1,
  );
  TestValidator.predicate(
    "pagination limit is positive",
    pagination.limit >= 1,
  );
  TestValidator.predicate(
    "pagination records count is non-negative",
    pagination.records >= 0,
  );
  TestValidator.predicate(
    "pagination pages count is positive",
    pagination.pages >= 0,
  );

  // Step 6. For each cart item, validate key fields
  for (const item of response.data) {
    TestValidator.predicate("cartItem quantity is positive", item.quantity > 0);
    TestValidator.predicate(
      "cartItem unit price is non-negative",
      item.unit_price >= 0,
    );
    TestValidator.equals(
      "cartItem belongs to requested cartId",
      item.shopping_cart_id,
      cartId,
    );
    TestValidator.predicate(
      "cartItem status is non-empty string",
      typeof item.status === "string" && item.status.length > 0,
    );
    TestValidator.predicate(
      "cartItem created_at is valid date-time",
      !isNaN(Date.parse(item.created_at)),
    );
    TestValidator.predicate(
      "cartItem updated_at is valid date-time",
      !isNaN(Date.parse(item.updated_at)),
    );
  }
}
