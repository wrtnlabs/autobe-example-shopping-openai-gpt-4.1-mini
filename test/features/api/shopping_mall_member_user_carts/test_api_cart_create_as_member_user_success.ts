import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallCarts } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCarts";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * This test validates the creation of a new shopping cart for an authenticated
 * member user. It ensures that the member user is first created and
 * authenticated successfully, establishing the proper authorization context.
 * The test then creates a shopping cart with the required status field and
 * links it to the authenticated member user. It asserts the correctness of the
 * response including assigned ID, status, and timestamps.
 */
export async function test_api_cart_create_as_member_user_success(
  connection: api.IConnection,
) {
  // Step 1: Create and authenticate a member user by calling join
  const memberUserCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(12),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    phone_number: RandomGenerator.mobile(),
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;
  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: memberUserCreateBody,
    });
  typia.assert(memberUser);

  // Step 2: Create a shopping cart linked to the member user
  const cartCreateBody = {
    member_user_id: memberUser.id,
    status: "active",
  } satisfies IShoppingMallCarts.ICreate;
  const cart: IShoppingMallCarts =
    await api.functional.shoppingMall.memberUser.carts.createCart(connection, {
      body: cartCreateBody,
    });
  typia.assert(cart);

  // Step 3: Validation of cart properties
  TestValidator.predicate(
    "cart.id is non-empty string",
    typeof cart.id === "string" && cart.id.length > 0,
  );
  TestValidator.equals(
    "cart status matches input",
    cart.status,
    cartCreateBody.status,
  );
  TestValidator.predicate(
    "cart member_user_id matches authenticated user",
    cart.member_user_id === memberUser.id,
  );
  TestValidator.predicate(
    "cart guest_user_id is null or undefined",
    cart.guest_user_id === null || cart.guest_user_id === undefined,
  );
  TestValidator.predicate(
    "cart created_at is ISO date-time string",
    typeof cart.created_at === "string" && !isNaN(Date.parse(cart.created_at)),
  );
  TestValidator.predicate(
    "cart updated_at is ISO date-time string",
    typeof cart.updated_at === "string" && !isNaN(Date.parse(cart.updated_at)),
  );
  TestValidator.predicate(
    "cart deleted_at is null or undefined",
    cart.deleted_at === null || cart.deleted_at === undefined,
  );
}
