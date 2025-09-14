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
import type { IShoppingMallSale } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSale";
import type { IShoppingMallSection } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSection";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * Test successful update of an existing payment for an order.
 *
 * The scenario includes creating memberUser, adminUser, sellerUser, creating a
 * sales channel, section, and sale product, and placing an order and payment by
 * memberUser. The test then updates the payment successfully while validating
 * role based access.
 *
 * Verifies both successful update and unauthorized access failure scenarios.
 */
export async function test_api_order_payment_update_success(
  connection: api.IConnection,
) {
  // Step 1: Create member user and authenticate as member
  const memberEmail = `${RandomGenerator.alphaNumeric(8)}@test.com`;
  const memberPassword = "Password123!";
  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: {
        email: memberEmail,
        password_hash: memberPassword,
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(2),
        status: "active",
      } satisfies IShoppingMallMemberUser.ICreate,
    });
  typia.assert(memberUser);

  // Step 2: Admin user sign up and authenticate
  const adminEmail = `${RandomGenerator.alphaNumeric(8)}@admin.com`;
  const adminPasswordHash = "AdminPass123!";
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: adminEmail,
        password_hash: adminPasswordHash,
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(2),
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // Switch authentication context to admin
  await api.functional.auth.adminUser.login(connection, {
    body: {
      email: adminEmail,
      password_hash: adminPasswordHash,
    } satisfies IShoppingMallAdminUser.ILogin,
  });

  // Step 3: Admin creates sales channel
  const channelCode = `chan-${RandomGenerator.alphaNumeric(6)}`;
  const channelName = RandomGenerator.name(2);
  const channel = await api.functional.shoppingMall.adminUser.channels.create(
    connection,
    {
      body: {
        code: channelCode,
        name: channelName,
        status: "active",
      } satisfies IShoppingMallChannel.ICreate,
    },
  );
  typia.assert(channel);

  // Step 4: Admin creates section
  const sectionCode = `sect-${RandomGenerator.alphaNumeric(6)}`;
  const sectionName = RandomGenerator.name(2);
  const section = await api.functional.shoppingMall.adminUser.sections.create(
    connection,
    {
      body: {
        code: sectionCode,
        name: sectionName,
        status: "active",
      } satisfies IShoppingMallSection.ICreate,
    },
  );
  typia.assert(section);

  // Step 5: Seller user join and authenticate
  const sellerEmail = `${RandomGenerator.alphaNumeric(8)}@seller.com`;
  const sellerPassword = "SellerPass123!";
  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: {
        email: sellerEmail,
        password: sellerPassword,
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(2),
        phone_number: RandomGenerator.mobile(),
        business_registration_number: `BRN${RandomGenerator.alphaNumeric(10)}`,
      } satisfies IShoppingMallSellerUser.ICreate,
    });
  typia.assert(sellerUser);

  // Switch authentication context to seller
  await api.functional.auth.sellerUser.login(connection, {
    body: {
      email: sellerEmail,
      password: sellerPassword,
    } satisfies IShoppingMallSellerUser.ILogin,
  });

  // Step 6: Seller creates sale product
  const saleCode = `sale-${RandomGenerator.alphaNumeric(6)}`;
  const saleProduct = await api.functional.shoppingMall.sellerUser.sales.create(
    connection,
    {
      body: {
        shopping_mall_channel_id: channel.id,
        shopping_mall_section_id: section.id,
        shopping_mall_seller_user_id: sellerUser.id,
        code: saleCode,
        status: "active",
        name: RandomGenerator.name(3),
        price: 10000,
      } satisfies IShoppingMallSale.ICreate,
    },
  );
  typia.assert(saleProduct);

  // Switch back to member user authentication
  await api.functional.auth.memberUser.login(connection, {
    body: {
      email: memberEmail,
      password: memberPassword,
    } satisfies IShoppingMallMemberUser.ILogin,
  });

  // Step 7: Member creates order
  const orderCode = `order-${RandomGenerator.alphaNumeric(6)}`;
  const order = await api.functional.shoppingMall.memberUser.orders.createOrder(
    connection,
    {
      body: {
        shopping_mall_memberuser_id: memberUser.id,
        shopping_mall_channel_id: channel.id,
        shopping_mall_section_id: section.id,
        order_code: orderCode,
        order_status: "pending",
        payment_status: "pending",
        total_price: 10000,
      } satisfies IShoppingMallOrder.ICreate,
    },
  );
  typia.assert(order);

  // Step 8: Member creates payment for order
  const paymentMethod = "credit_card";
  const paymentStatusPending = "pending";
  const paymentCreateReq = {
    shopping_mall_order_id: order.id,
    payment_method: paymentMethod,
    payment_status: paymentStatusPending,
    payment_amount: 10000,
    transaction_id: null,
  } satisfies IShoppingMallPayment.ICreate;

  const payment =
    await api.functional.shoppingMall.memberUser.orders.payments.create(
      connection,
      {
        orderId: order.id,
        body: paymentCreateReq,
      },
    );
  typia.assert(payment);

  // Step 9: Update payment
  // Update payment status to "confirmed" and adjust payment amount
  const paymentUpdateReq = {
    payment_status: "confirmed",
    payment_amount: 12000,
    transaction_id: `TXN${RandomGenerator.alphaNumeric(10)}`,
    cancelled_at: null,
    shopping_mall_order_id: order.id,
    payment_method: paymentMethod,
  } satisfies IShoppingMallPayment.IUpdate;

  const updatedPayment =
    await api.functional.shoppingMall.memberUser.orders.payments.update(
      connection,
      {
        orderId: order.id,
        paymentId: payment.id,
        body: paymentUpdateReq,
      },
    );
  typia.assert(updatedPayment);

  // Validate updatedPayment properties
  TestValidator.equals(
    "payment_status should be confirmed",
    updatedPayment.payment_status,
    "confirmed",
  );
  TestValidator.equals(
    "payment_amount should be 12000",
    updatedPayment.payment_amount,
    12000,
  );
  TestValidator.equals(
    "payment_method matches",
    updatedPayment.payment_method,
    paymentMethod,
  );
  TestValidator.equals(
    "transaction_id matches",
    updatedPayment.transaction_id,
    paymentUpdateReq.transaction_id,
  );

  // Step 10: Negative scenario - unauthorized user cannot update payment
  // Create another member user
  const fakeMemberEmail = `${RandomGenerator.alphaNumeric(8)}@test.com`;
  const fakeMemberPassword = "FakePass456!";
  const fakeMemberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: {
        email: fakeMemberEmail,
        password_hash: fakeMemberPassword,
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(2),
        status: "active",
      } satisfies IShoppingMallMemberUser.ICreate,
    });
  typia.assert(fakeMemberUser);

  // Login as fake member user
  await api.functional.auth.memberUser.login(connection, {
    body: {
      email: fakeMemberEmail,
      password: fakeMemberPassword,
    } satisfies IShoppingMallMemberUser.ILogin,
  });

  // Attempt to update payment of original member user order, expect error
  await TestValidator.error(
    "unauthorized payment update should fail",
    async () => {
      await api.functional.shoppingMall.memberUser.orders.payments.update(
        connection,
        {
          orderId: order.id,
          paymentId: payment.id,
          body: {
            payment_status: "cancelled",
          } satisfies IShoppingMallPayment.IUpdate,
        },
      );
    },
  );
}
