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
 * Test updating an existing payment successfully by a seller user.
 *
 * This end-to-end test covers the complete user flow involving multiple
 * roles:
 *
 * - Seller user registration, login, and context establishment.
 * - Admin user registration, login, creation of sales channel and section.
 * - Seller user creation of a sale product linked to the created channel and
 *   section.
 * - Member user registration, login, creation of order referencing the sale.
 * - Member user creation of payment for the order.
 * - Seller user login and update of the payment with valid data.
 * - Validation that the payment update response reflects all changes
 *   accurately.
 *
 * All operations strictly follow API contracts and DTO schemas, using typia
 * assertions for runtime validation and RandomGenerator for realistic test
 * data. Role switching is done via correct authentication APIs, and
 * business logic validation occurs through TestValidator assertions.
 *
 * Authentication tokens are automatically handled by the SDK. No manual
 * header management is performed.
 *
 * This test ensures the integrity of payment update flows with full
 * multi-user business role support.
 */
export async function test_api_order_payment_update_by_seller_success(
  connection: api.IConnection,
) {
  // Seller user registration
  const sellerEmail = typia.random<string & tags.Format<"email">>();
  const seller = await api.functional.auth.sellerUser.join(connection, {
    body: {
      email: sellerEmail,
      password: "seller1234",
      nickname: RandomGenerator.name(),
      full_name: RandomGenerator.name(),
      phone_number: RandomGenerator.mobile(),
      business_registration_number: RandomGenerator.alphaNumeric(12),
    } satisfies IShoppingMallSellerUser.ICreate,
  });
  typia.assert(seller);

  // Seller user login
  await api.functional.auth.sellerUser.login(connection, {
    body: {
      email: sellerEmail,
      password: "seller1234",
    } satisfies IShoppingMallSellerUser.ILogin,
  });

  // Admin user registration
  const adminEmail = typia.random<string & tags.Format<"email">>();
  const admin = await api.functional.auth.adminUser.join(connection, {
    body: {
      email: adminEmail,
      password_hash: "admin1234",
      nickname: RandomGenerator.name(),
      full_name: RandomGenerator.name(),
      status: "active",
    } satisfies IShoppingMallAdminUser.ICreate,
  });
  typia.assert(admin);

  // Admin user login
  await api.functional.auth.adminUser.login(connection, {
    body: {
      email: adminEmail,
      password_hash: "admin1234",
    } satisfies IShoppingMallAdminUser.ILogin,
  });

  // Create channel as admin user
  const channelCode = RandomGenerator.alphaNumeric(6);
  const channelName = RandomGenerator.name();
  const channelDescription = RandomGenerator.paragraph({ sentences: 3 });
  const channelStatus = "active";
  const channel = await api.functional.shoppingMall.adminUser.channels.create(
    connection,
    {
      body: {
        code: channelCode,
        name: channelName,
        description: channelDescription,
        status: channelStatus,
      } satisfies IShoppingMallChannel.ICreate,
    },
  );
  typia.assert(channel);

  // Create section as admin user
  const sectionCode = RandomGenerator.alphaNumeric(5);
  const sectionName = RandomGenerator.name();
  const sectionDescription = RandomGenerator.paragraph({ sentences: 2 });
  const sectionStatus = "active";
  const section = await api.functional.shoppingMall.adminUser.sections.create(
    connection,
    {
      body: {
        code: sectionCode,
        name: sectionName,
        description: sectionDescription,
        status: sectionStatus,
      } satisfies IShoppingMallSection.ICreate,
    },
  );
  typia.assert(section);

  // Seller user creates sale product
  const saleCode = RandomGenerator.alphaNumeric(10);
  const saleStatus = "active";
  const saleName = RandomGenerator.name();
  const saleDescription = RandomGenerator.content({ paragraphs: 2 });
  const salePrice = Math.floor(Math.random() * 100000) + 1000;
  const sale = await api.functional.shoppingMall.sellerUser.sales.create(
    connection,
    {
      body: {
        shopping_mall_channel_id: channel.id,
        shopping_mall_section_id: section.id,
        shopping_mall_seller_user_id: seller.id,
        code: saleCode,
        status: saleStatus,
        name: saleName,
        description: saleDescription,
        price: salePrice,
      } satisfies IShoppingMallSale.ICreate,
    },
  );
  typia.assert(sale);

  // Member user registration
  const memberEmail = typia.random<string & tags.Format<"email">>();
  const memberPassword = "member1234";
  const member = await api.functional.auth.memberUser.join(connection, {
    body: {
      email: memberEmail,
      password_hash: memberPassword,
      nickname: RandomGenerator.name(),
      full_name: RandomGenerator.name(),
      phone_number: RandomGenerator.mobile(),
      status: "active",
    } satisfies IShoppingMallMemberUser.ICreate,
  });
  typia.assert(member);

  // Member user login
  await api.functional.auth.memberUser.login(connection, {
    body: {
      email: memberEmail,
      password: memberPassword,
    } satisfies IShoppingMallMemberUser.ILogin,
  });

  // Member user creates order
  const orderCode = `${RandomGenerator.alphaNumeric(8)}`;
  const orderStatus = "pending";
  const paymentStatus = "pending";
  const totalPrice = sale.price;
  const order = await api.functional.shoppingMall.memberUser.orders.createOrder(
    connection,
    {
      body: {
        shopping_mall_memberuser_id: member.id,
        shopping_mall_channel_id: channel.id,
        shopping_mall_section_id: section.id,
        order_code: orderCode,
        order_status: orderStatus,
        payment_status: paymentStatus,
        total_price: totalPrice,
      } satisfies IShoppingMallOrder.ICreate,
    },
  );
  typia.assert(order);

  // Member user creates payment
  const paymentMethod = "credit_card";
  const paymentStatusPending = "pending";
  const paymentAmount = order.total_price;
  const externalTransactionId = RandomGenerator.alphaNumeric(12);
  const payment =
    await api.functional.shoppingMall.memberUser.orders.payments.create(
      connection,
      {
        orderId: order.id,
        body: {
          shopping_mall_order_id: order.id,
          payment_method: paymentMethod,
          payment_status: paymentStatusPending,
          payment_amount: paymentAmount,
          transaction_id: externalTransactionId,
        } satisfies IShoppingMallPayment.ICreate,
      },
    );
  typia.assert(payment);

  // Seller user login
  await api.functional.auth.sellerUser.login(connection, {
    body: {
      email: sellerEmail,
      password: "seller1234",
    } satisfies IShoppingMallSellerUser.ILogin,
  });

  // Seller user updates payment
  const updatedPaymentMethod = "bank_transfer";
  const updatedPaymentStatus = "confirmed";
  const updatedPaymentAmount = payment.payment_amount + 1000;
  const updatedTransactionId = RandomGenerator.alphaNumeric(16);
  const cancelledAtTimestamp = null;

  const updatedPayment =
    await api.functional.shoppingMall.sellerUser.orders.payments.update(
      connection,
      {
        orderId: order.id,
        paymentId: payment.id,
        body: {
          payment_method: updatedPaymentMethod,
          payment_status: updatedPaymentStatus,
          payment_amount: updatedPaymentAmount,
          transaction_id: updatedTransactionId,
          cancelled_at: cancelledAtTimestamp,
        } satisfies IShoppingMallPayment.IUpdate,
      },
    );
  typia.assert(updatedPayment);

  // Validate updated payment
  TestValidator.equals(
    "updated payment id should match",
    updatedPayment.id,
    payment.id,
  );
  TestValidator.equals(
    "updated payment method should match",
    updatedPayment.payment_method,
    updatedPaymentMethod,
  );
  TestValidator.equals(
    "updated payment status should match",
    updatedPayment.payment_status,
    updatedPaymentStatus,
  );
  TestValidator.equals(
    "updated payment amount should match",
    updatedPayment.payment_amount,
    updatedPaymentAmount,
  );
  TestValidator.equals(
    "updated transaction id should match",
    updatedPayment.transaction_id,
    updatedTransactionId,
  );
  TestValidator.equals(
    "cancelled_at should be null",
    updatedPayment.cancelled_at,
    cancelledAtTimestamp,
  );
}
