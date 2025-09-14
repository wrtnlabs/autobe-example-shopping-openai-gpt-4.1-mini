import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";
import type { IShoppingMallOrder } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrder";
import type { IShoppingMallPayment } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallPayment";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * Test scenario for successful payment creation by seller user for an
 * existing order.
 *
 * Business context:
 *
 * - Seller user registers and authenticates.
 * - Member user registers and authenticates.
 * - Member user creates a new order with all required properties.
 * - Seller user login to switch session to seller role.
 * - Seller user creates a payment for the created order.
 * - The payment has valid payment method, status "pending", positive amount,
 *   and optional null transaction ID.
 *
 * Step-by-step:
 *
 * 1. Register a seller user and assert.
 * 2. Register a member user and assert.
 * 3. Login member user to establish authentication.
 * 4. Member user creates an order with valid fields.
 * 5. Assert order creation.
 * 6. Login seller user to switch auth.
 * 7. Seller user creates a payment for the order with valid payload.
 * 8. Assert the created payment response.
 */
export async function test_api_sellerorder_payment_create_success(
  connection: api.IConnection,
) {
  // 1. Seller user registers
  const sellerCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password: "StrongPass!23",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: RandomGenerator.mobile(),
    business_registration_number: RandomGenerator.alphaNumeric(10),
  } satisfies IShoppingMallSellerUser.ICreate;
  const seller: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: sellerCreateBody,
    });
  typia.assert(seller);

  // 2. Member user registers
  const memberCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: "HashedPassword123!",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: RandomGenerator.mobile(),
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;
  const member: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: memberCreateBody,
    });
  typia.assert(member);

  // 3. Member user login
  const memberLoginBody = {
    email: memberCreateBody.email,
    password: "StrongPasswordForLogin!23",
  } satisfies IShoppingMallMemberUser.ILogin;
  const memberLogin: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.login(connection, {
      body: memberLoginBody,
    });
  typia.assert(memberLogin);

  // 4. Member user creates order
  const orderCreateBody = {
    shopping_mall_memberuser_id: member.id,
    shopping_mall_channel_id: typia.random<string & tags.Format<"uuid">>(),
    shopping_mall_section_id: null,
    order_code: RandomGenerator.alphaNumeric(12),
    order_status: "pending",
    payment_status: "pending",
    total_price: 50000,
  } satisfies IShoppingMallOrder.ICreate;
  const order: IShoppingMallOrder =
    await api.functional.shoppingMall.memberUser.orders.createOrder(
      connection,
      {
        body: orderCreateBody,
      },
    );
  typia.assert(order);
  TestValidator.equals(
    "order ID matches",
    order.shopping_mall_memberuser_id,
    member.id,
  );

  // 5. Seller user login to switch authorization
  const sellerLoginBody = {
    email: sellerCreateBody.email,
    password: sellerCreateBody.password,
  } satisfies IShoppingMallSellerUser.ILogin;
  const sellerLogin: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.login(connection, {
      body: sellerLoginBody,
    });
  typia.assert(sellerLogin);

  // 6. Seller user creates payment for the order
  const paymentCreateBody = {
    shopping_mall_order_id: order.id,
    payment_method: "credit_card",
    payment_status: "pending",
    payment_amount: 50000,
    transaction_id: null,
  } satisfies IShoppingMallPayment.ICreate;
  const payment: IShoppingMallPayment =
    await api.functional.shoppingMall.sellerUser.orders.payments.create(
      connection,
      {
        orderId: order.id,
        body: paymentCreateBody,
      },
    );
  typia.assert(payment);

  // Business logic validations
  TestValidator.equals(
    "payment orderId matches",
    payment.shopping_mall_order_id,
    order.id,
  );
  TestValidator.equals(
    "payment status is pending",
    payment.payment_status,
    "pending",
  );
  TestValidator.predicate(
    "payment amount is positive",
    payment.payment_amount > 0,
  );
  TestValidator.equals("transaction ID is null", payment.transaction_id, null);
  TestValidator.equals(
    "payment method is credit_card",
    payment.payment_method,
    "credit_card",
  );
}
