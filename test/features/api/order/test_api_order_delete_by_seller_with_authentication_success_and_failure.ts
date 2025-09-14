import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallOrder } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrder";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * This test ensures that a seller user can create an account, create an order,
 * and delete that order. It covers both successful deletion and failure cases
 * with authentication handling.
 */
export async function test_api_order_delete_by_seller_with_authentication_success_and_failure(
  connection: api.IConnection,
) {
  // Step 1: Seller user signs up
  const sellerCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password: "P@ssw0rd123!",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    phone_number: null,
    business_registration_number: `BRN${RandomGenerator.alphaNumeric(9)}`,
  } satisfies IShoppingMallSellerUser.ICreate;

  const authorizedSeller: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: sellerCreateBody,
    });
  typia.assert(authorizedSeller);

  // Step 2: Seller creates an order
  const orderCreateBody = {
    shopping_mall_memberuser_id: typia.random<string & tags.Format<"uuid">>(),
    shopping_mall_channel_id: typia.random<string & tags.Format<"uuid">>(),
    shopping_mall_section_id: null,
    order_code: `OC-${RandomGenerator.alphaNumeric(6).toUpperCase()}`,
    order_status: "pending",
    payment_status: "pending",
    total_price: Number((Math.random() * 1000 + 100).toFixed(2)),
  } satisfies IShoppingMallOrder.ICreate;

  const createdOrder: IShoppingMallOrder =
    await api.functional.shoppingMall.sellerUser.orders.createOrder(
      connection,
      {
        body: orderCreateBody,
      },
    );
  typia.assert(createdOrder);

  TestValidator.equals(
    "Order code matches",
    createdOrder.order_code,
    orderCreateBody.order_code,
  );

  // Step 3: Delete the created order
  await api.functional.shoppingMall.sellerUser.orders.eraseOrder(connection, {
    orderId: createdOrder.id,
  });

  // Step 4: Failure case - attempt deletion with unauthenticated connection
  const unauthConn: api.IConnection = { ...connection, headers: {} };

  await TestValidator.error("Unauthorized deletion should fail", async () => {
    await api.functional.shoppingMall.sellerUser.orders.eraseOrder(unauthConn, {
      orderId: createdOrder.id,
    });
  });
}
