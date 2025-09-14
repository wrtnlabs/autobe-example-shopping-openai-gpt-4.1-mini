import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallCartItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCartItem";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * This test validates successful retrieval of detailed information about a
 * specific cart item belonging to a member user's shopping cart.
 *
 * The test performs two member user registrations to establish
 * authenticated contexts as per scenario dependencies. It then requests the
 * cart item detail API for a given cartId and cartItemId, asserting correct
 * response structure and critical business fields.
 *
 * Detailed validations include quantity positivity, price non-negativity,
 * matching cart and item IDs, status presence, UUID format of linked
 * product snapshot, and proper timestamp formatting.
 *
 * This ensures authorized member users can correctly access their cart item
 * details with accurate, valid data per API contract.
 */
export async function test_api_cart_item_detail_success(
  connection: api.IConnection,
) {
  // 1. Create first member user to establish authentication context
  const memberUser1: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: {
        email: `user1_${typia.random<string & tags.Format<"email">>()}`,
        password_hash: "strongpasswordhash1",
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        phone_number: RandomGenerator.mobile(),
        status: "active",
      } satisfies IShoppingMallMemberUser.ICreate,
    });
  typia.assert(memberUser1);

  // 2. Create second member user (dependency) to fulfill scenario prerequisite
  const memberUser2: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: {
        email: `user2_${typia.random<string & tags.Format<"email">>()}`,
        password_hash: "strongpasswordhash2",
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        phone_number: RandomGenerator.mobile(),
        status: "active",
      } satisfies IShoppingMallMemberUser.ICreate,
    });
  typia.assert(memberUser2);

  // 3. Prepare inputs for cart item detail retrieval
  // Use valid UUIDs for cartId and cartItemId
  const cartId = typia.random<string & tags.Format<"uuid">>();
  const cartItemId = typia.random<string & tags.Format<"uuid">>();

  // 4. Retrieve detailed information of the specific cart item
  const cartItem: IShoppingMallCartItem =
    await api.functional.shoppingMall.memberUser.carts.cartItems.at(
      connection,
      {
        cartId,
        cartItemId,
      },
    );
  typia.assert(cartItem);

  // 5. Validate critical fields in the response
  TestValidator.predicate(
    "cart item quantity should be a positive integer",
    cartItem.quantity > 0 && Number.isInteger(cartItem.quantity),
  );

  TestValidator.predicate(
    "cart item unit_price should be a non-negative number",
    typeof cartItem.unit_price === "number" && cartItem.unit_price >= 0,
  );

  TestValidator.equals(
    "cart item shopping_cart_id should match cartId input",
    cartItem.shopping_cart_id,
    cartId,
  );

  TestValidator.equals(
    "cart item id should match cartItemId input",
    cartItem.id,
    cartItemId,
  );

  TestValidator.predicate(
    "cart item status should be a non-empty string",
    typeof cartItem.status === "string" && cartItem.status.length > 0,
  );

  // 6. Additional business validations can be added here if needed,
  // such as verifying shopping_sale_snapshot_id format or deletion timestamps
  TestValidator.predicate(
    "shopping_sale_snapshot_id should be a valid UUID",
    typeof cartItem.shopping_sale_snapshot_id === "string" &&
      /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        cartItem.shopping_sale_snapshot_id,
      ),
  );

  TestValidator.predicate(
    "created_at and updated_at should be ISO 8601 date-time strings",
    typeof cartItem.created_at === "string" &&
      !isNaN(Date.parse(cartItem.created_at)) &&
      typeof cartItem.updated_at === "string" &&
      !isNaN(Date.parse(cartItem.updated_at)),
  );

  // 7. Proper null handling for deleted_at field
  TestValidator.predicate(
    "deleted_at should be null or a valid ISO 8601 date-time string",
    cartItem.deleted_at === null ||
      (typeof cartItem.deleted_at === "string" &&
        !isNaN(Date.parse(cartItem.deleted_at))) ||
      cartItem.deleted_at === undefined,
  );
}
