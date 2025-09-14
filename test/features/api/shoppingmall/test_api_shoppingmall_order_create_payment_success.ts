import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallChannel } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallChannel";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";
import type { IShoppingMallOrder } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrder";
import type { IShoppingMallPayment } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallPayment";
import type { IShoppingMallSection } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSection";

/**
 * Test the successful creation of a payment application for a specific
 * order by an admin user.
 *
 * This test performs the full flow including:
 *
 * 1. Admin user joins to establish authentication and authorization context.
 * 2. Member user joins to create a customer to associate with the order.
 * 3. Admin user creates a sales channel to use in order creation.
 * 4. Admin user creates a spatial section associated with the mall.
 * 5. Admin user creates an order with references to the member user, channel,
 *    and section.
 * 6. Admin user creates a payment application for the order, specifying
 *    method, status, and amount.
 *
 * Each creation step validates the returned data structure and values using
 * typia.assert and TestValidator.
 *
 * This covers authentication, resource creation dependencies, and payment
 * application workflows in the shopping mall system.
 */
export async function test_api_shoppingmall_order_create_payment_success(
  connection: api.IConnection,
) {
  // 1. Admin user joins
  const adminUserBody = {
    email: RandomGenerator.alphabets(5) + "@admin.com",
    password_hash: "testpassword",
    nickname: RandomGenerator.name(2),
    full_name: RandomGenerator.name(2),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminUserBody,
    });
  typia.assert(adminUser);

  // 2. Member user joins
  const memberUserBody = {
    email: RandomGenerator.alphabets(5) + "@member.com",
    password_hash: "testpassword",
    nickname: RandomGenerator.name(2),
    full_name: RandomGenerator.name(2),
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;
  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: memberUserBody,
    });
  typia.assert(memberUser);

  // 3. Admin user creates a sales channel
  const channelBody = {
    code: RandomGenerator.alphaNumeric(8),
    name: RandomGenerator.name(2),
    description: null,
    status: "active",
  } satisfies IShoppingMallChannel.ICreate;
  const channel: IShoppingMallChannel =
    await api.functional.shoppingMall.adminUser.channels.create(connection, {
      body: channelBody,
    });
  typia.assert(channel);

  // 4. Admin user creates a spatial section
  const sectionBody = {
    code: RandomGenerator.alphaNumeric(8),
    name: RandomGenerator.name(2),
    description: null,
    status: "active",
  } satisfies IShoppingMallSection.ICreate;
  const section: IShoppingMallSection =
    await api.functional.shoppingMall.adminUser.sections.create(connection, {
      body: sectionBody,
    });
  typia.assert(section);

  // 5. Admin user creates an order with references
  const orderBody = {
    shopping_mall_memberuser_id: memberUser.id,
    shopping_mall_channel_id: channel.id,
    shopping_mall_section_id: section.id,
    order_code: RandomGenerator.alphaNumeric(12),
    order_status: "pending",
    payment_status: "pending",
    total_price: 10000,
  } satisfies IShoppingMallOrder.ICreate;
  const order: IShoppingMallOrder =
    await api.functional.shoppingMall.adminUser.orders.createOrder(connection, {
      body: orderBody,
    });
  typia.assert(order);

  // 6. Admin user creates a payment for the order
  const paymentBody = {
    shopping_mall_order_id: order.id,
    payment_method: "credit_card",
    payment_status: "pending",
    payment_amount: 10000,
    transaction_id: null,
  } satisfies IShoppingMallPayment.ICreate;
  const payment: IShoppingMallPayment =
    await api.functional.shoppingMall.adminUser.orders.payments.create(
      connection,
      { orderId: order.id, body: paymentBody },
    );
  typia.assert(payment);

  TestValidator.equals(
    "payment order ID matches",
    payment.shopping_mall_order_id,
    order.id,
  );
  TestValidator.equals(
    "payment method matches",
    payment.payment_method,
    paymentBody.payment_method,
  );
  TestValidator.equals(
    "payment status matches",
    payment.payment_status,
    paymentBody.payment_status,
  );
  TestValidator.equals(
    "payment amount matches",
    payment.payment_amount,
    paymentBody.payment_amount,
  );
  TestValidator.equals(
    "payment transaction ID is null",
    payment.transaction_id,
    null,
  );
}
