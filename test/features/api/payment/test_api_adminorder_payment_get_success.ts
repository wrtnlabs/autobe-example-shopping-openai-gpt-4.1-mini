import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";
import type { IShoppingMallOrder } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrder";
import type { IShoppingMallPayment } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallPayment";

/**
 * Test scenario for successful retrieval of a payment application detail by
 * an admin user.
 *
 * This test performs the following step-by-step workflow:
 *
 * 1. Create an admin user by join operation and authenticate.
 * 2. Create a member user by join operation and authenticate.
 * 3. Create a new order for the member user.
 * 4. Create a new payment application linked to the order by the member user.
 * 5. Authenticate again as admin user to establish admin context.
 * 6. Retrieve the payment detail by admin user using orderId and paymentId.
 * 7. Validate the integrity of the retrieved payment against created payment
 *    data.
 */
export async function test_api_adminorder_payment_get_success(
  connection: api.IConnection,
) {
  // 1. Admin user join (create admin account)
  const adminUserEmail: string = typia.random<string & tags.Format<"email">>();
  const adminUserPassword: string = RandomGenerator.alphaNumeric(12);
  const adminUserCreateBody = {
    email: adminUserEmail,
    password_hash: adminUserPassword,
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminUserCreateBody,
    });
  typia.assert(adminUser);

  // 2. Member user join (create member account)
  const memberUserEmail: string = typia.random<string & tags.Format<"email">>();
  const memberUserPassword: string = RandomGenerator.alphaNumeric(12);
  const memberUserCreateBody = {
    email: memberUserEmail,
    password_hash: memberUserPassword,
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

  // 3. Create a new order for the member user
  const orderCreateBody = {
    shopping_mall_memberuser_id: memberUser.id,
    shopping_mall_channel_id: typia.random<string & tags.Format<"uuid">>(),
    shopping_mall_section_id: null,
    order_code: RandomGenerator.alphaNumeric(10).toUpperCase(),
    order_status: "pending",
    payment_status: "pending",
    total_price: 10000,
  } satisfies IShoppingMallOrder.ICreate;
  const order: IShoppingMallOrder =
    await api.functional.shoppingMall.memberUser.orders.createOrder(
      connection,
      {
        body: orderCreateBody,
      },
    );
  typia.assert(order);

  // 4. Member user creates a new payment application linked to the order
  const paymentCreateBody = {
    shopping_mall_order_id: order.id,
    payment_method: "credit_card",
    payment_status: "pending",
    payment_amount: 10000,
    transaction_id: null,
  } satisfies IShoppingMallPayment.ICreate;
  const payment: IShoppingMallPayment =
    await api.functional.shoppingMall.memberUser.orders.payments.create(
      connection,
      {
        orderId: order.id,
        body: paymentCreateBody,
      },
    );
  typia.assert(payment);

  // 5. Admin user login to switch role and authenticate as admin
  const adminUserLoginBody = {
    email: adminUserEmail,
    password_hash: adminUserPassword,
  } satisfies IShoppingMallAdminUser.ILogin;
  const adminUserLogin: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.login(connection, {
      body: adminUserLoginBody,
    });
  typia.assert(adminUserLogin);

  // 6. Retrieve the payment detail by admin user
  const retrievedPayment: IShoppingMallPayment =
    await api.functional.shoppingMall.adminUser.orders.payments.at(connection, {
      orderId: order.id,
      paymentId: payment.id,
    });
  typia.assert(retrievedPayment);

  // 7. Validate that retrieved payment matches the created payment
  TestValidator.equals("payment id matches", retrievedPayment.id, payment.id);
  TestValidator.equals(
    "order id matches",
    retrievedPayment.shopping_mall_order_id,
    payment.shopping_mall_order_id,
  );
  TestValidator.equals(
    "payment method matches",
    retrievedPayment.payment_method,
    payment.payment_method,
  );
  TestValidator.equals(
    "payment status matches",
    retrievedPayment.payment_status,
    payment.payment_status,
  );
  TestValidator.equals(
    "payment amount matches",
    retrievedPayment.payment_amount,
    payment.payment_amount,
  );
  TestValidator.equals(
    "transaction id matches",
    retrievedPayment.transaction_id,
    payment.transaction_id,
  );
}
