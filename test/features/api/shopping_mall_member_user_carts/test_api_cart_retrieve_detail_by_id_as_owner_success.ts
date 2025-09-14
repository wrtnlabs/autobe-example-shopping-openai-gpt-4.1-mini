import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallCarts } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCarts";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * Test retrieving detailed information of a member user's shopping cart by cart
 * ID. Ensure the member user is authorized and owns the cart. Include
 * validation of responses and permissions.
 */
export async function test_api_cart_retrieve_detail_by_id_as_owner_success(
  connection: api.IConnection,
) {
  // 1. Member user joins (signs up) and authenticates
  const memberUserCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(32),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    phone_number: null,
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;

  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: memberUserCreateBody,
    });
  typia.assert(memberUser);

  // 2. Create a shopping cart linked explicitly to the authenticated member user
  const cartCreateBody = {
    member_user_id: memberUser.id,
    guest_user_id: null,
    status: "active",
  } satisfies IShoppingMallCarts.ICreate;

  const createdCart: IShoppingMallCarts =
    await api.functional.shoppingMall.memberUser.carts.createCart(connection, {
      body: cartCreateBody,
    });
  typia.assert(createdCart);

  // 3. Retrieve detailed cart information by cartId
  const retrievedCart: IShoppingMallCarts =
    await api.functional.shoppingMall.memberUser.carts.getCart(connection, {
      cartId: createdCart.id,
    });
  typia.assert(retrievedCart);

  // 4. Validate that retrieved cart matches the created cart and ownership
  TestValidator.equals(
    "cart id should match",
    retrievedCart.id,
    createdCart.id,
  );
  TestValidator.equals(
    "member user id should match",
    retrievedCart.member_user_id,
    memberUser.id,
  );
  TestValidator.equals(
    "guest user id should be null",
    retrievedCart.guest_user_id,
    null,
  );
  TestValidator.equals(
    "cart status should be active",
    retrievedCart.status,
    "active",
  );

  // 5. Validate timestamps existence and proper ISO 8601 date-time formats
  for (const timestampName of ["created_at", "updated_at"] as const) {
    const timestampValue = retrievedCart[timestampName];
    // Assert it exists and is ISO 8601 date-time string format
    TestValidator.predicate(
      `${timestampName} should be string and ISO 8601 format`,
      typeof timestampValue === "string" &&
        /^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])T([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9](\.\d+)?Z$/.test(
          timestampValue,
        ),
    );
  }

  // 6. If deleted_at field exists, it should be either null or ISO 8601 date-time string
  const deletedAt = retrievedCart.deleted_at;
  if (deletedAt !== null && deletedAt !== undefined) {
    TestValidator.predicate(
      `deleted_at should be string and ISO 8601 format if not null`,
      typeof deletedAt === "string" &&
        /^[0-9]{4}-(0[1-9]|1[0-2])-(0[1-9]|[12][0-9]|3[01])T([01][0-9]|2[0-3]):[0-5][0-9]:[0-5][0-9](\.\d+)?Z$/.test(
          deletedAt,
        ),
    );
  } else {
    TestValidator.equals(
      `deleted_at should be null or undefined`,
      deletedAt,
      null,
    );
  }
}
