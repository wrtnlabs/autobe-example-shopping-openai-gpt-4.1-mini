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
 * This E2E test function validates the authorized deletion of an order
 * payment by an admin user.
 *
 * The workflow follows the full business process of creating multiple roles
 * and resources:
 *
 * 1. Register and authenticate an admin user.
 * 2. Register a member user.
 * 3. Register and authenticate a seller user.
 * 4. Create a sales channel under the admin user.
 * 5. Create a spatial section within the sales channel.
 * 6. Seller creates a sales product linked to channel and section.
 * 7. Admin user creates an order linked with the member, channel, and section.
 * 8. Admin user places a payment for the order.
 * 9. Admin user deletes the created payment.
 *
 * Each step involves strong type-checked API calls, proper role
 * authentication, and verification of expected outcomes.
 *
 * This test ensures the full authorization and data linkage flow for
 * payment deletion, validating secure and correct operation within the
 * shopping mall backend system.
 */
export async function test_api_payment_delete_order_payment_authorized(
  connection: api.IConnection,
) {
  // 1. Admin user registration and authentication
  const adminEmail: string = typia.random<string & tags.Format<"email">>();
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: adminEmail,
        password_hash: "password1234",
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(2),
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // 2. Member user registration
  const memberEmail: string = typia.random<string & tags.Format<"email">>();
  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: {
        email: memberEmail,
        password_hash: "password1234",
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(2),
        phone_number: RandomGenerator.mobile(),
        status: "active",
      } satisfies IShoppingMallMemberUser.ICreate,
    });
  typia.assert(memberUser);

  // 3. Seller user registration and login
  const sellerEmail: string = typia.random<string & tags.Format<"email">>();
  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: {
        email: sellerEmail,
        password: "password1234",
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(2),
        phone_number: RandomGenerator.mobile(),
        business_registration_number: `BRN${RandomGenerator.alphaNumeric(9)}`,
      } satisfies IShoppingMallSellerUser.ICreate,
    });
  typia.assert(sellerUser);

  // Ensure seller login to refresh auth context
  await api.functional.auth.sellerUser.login(connection, {
    body: {
      email: sellerEmail,
      password: "password1234",
    } satisfies IShoppingMallSellerUser.ILogin,
  });

  // 4. Admin user creates a sales channel
  await api.functional.auth.adminUser.login(connection, {
    body: {
      email: adminEmail,
      password_hash: "password1234",
    } satisfies IShoppingMallAdminUser.ILogin,
  });

  const channelCode = RandomGenerator.alphaNumeric(5);
  const channelName = RandomGenerator.name(2);
  const channelDescription = RandomGenerator.paragraph({ sentences: 3 });
  const channelStatus = "active";
  const channel: IShoppingMallChannel =
    await api.functional.shoppingMall.adminUser.channels.create(connection, {
      body: {
        code: channelCode,
        name: channelName,
        description: channelDescription,
        status: channelStatus,
      } satisfies IShoppingMallChannel.ICreate,
    });
  typia.assert(channel);

  // 5. Admin user creates a spatial section
  const sectionCode = channelCode + "_S" + RandomGenerator.alphaNumeric(2);
  const sectionName = RandomGenerator.name(2);
  const sectionDescription = RandomGenerator.paragraph({ sentences: 2 });
  const sectionStatus = "active";
  const section: IShoppingMallSection =
    await api.functional.shoppingMall.adminUser.sections.create(connection, {
      body: {
        code: sectionCode,
        name: sectionName,
        description: sectionDescription,
        status: sectionStatus,
      } satisfies IShoppingMallSection.ICreate,
    });
  typia.assert(section);

  // 6. Seller creates a sales product
  await api.functional.auth.sellerUser.login(connection, {
    body: {
      email: sellerEmail,
      password: "password1234",
    } satisfies IShoppingMallSellerUser.ILogin,
  });

  const saleCode = "SALE" + RandomGenerator.alphaNumeric(5).toUpperCase();
  const saleName = RandomGenerator.name(3);
  const saleDescription = RandomGenerator.content({ paragraphs: 1 });
  const saleStatus = "active";
  const salePrice = 10000;
  const sale: IShoppingMallSale =
    await api.functional.shoppingMall.sellerUser.sales.create(connection, {
      body: {
        shopping_mall_channel_id: channel.id,
        shopping_mall_section_id: section.id,
        shopping_mall_seller_user_id: sellerUser.id,
        code: saleCode,
        status: saleStatus,
        name: saleName,
        description: saleDescription,
        price: salePrice,
      } satisfies IShoppingMallSale.ICreate,
    });
  typia.assert(sale);

  // 7. Admin user creates an order linked to member, channel, section
  await api.functional.auth.adminUser.login(connection, {
    body: {
      email: adminEmail,
      password_hash: "password1234",
    } satisfies IShoppingMallAdminUser.ILogin,
  });

  const orderCode = "ORD" + RandomGenerator.alphaNumeric(8).toUpperCase();
  const orderStatus = "pending";
  const paymentStatus = "pending";
  const totalPrice = salePrice;
  const order: IShoppingMallOrder =
    await api.functional.shoppingMall.adminUser.orders.createOrder(connection, {
      body: {
        shopping_mall_memberuser_id: memberUser.id,
        shopping_mall_channel_id: channel.id,
        shopping_mall_section_id: section.id,
        order_code: orderCode,
        order_status: orderStatus,
        payment_status: paymentStatus,
        total_price: totalPrice,
      } satisfies IShoppingMallOrder.ICreate,
    });
  typia.assert(order);

  // 8. Admin user creates a payment for the order
  const paymentMethod = "credit_card";
  const paymentStatusCreate = "pending";
  const paymentAmount = totalPrice;
  const paymentTransactionId = `TXN${RandomGenerator.alphaNumeric(12).toUpperCase()}`;
  const payment: IShoppingMallPayment =
    await api.functional.shoppingMall.adminUser.orders.payments.create(
      connection,
      {
        orderId: order.id,
        body: {
          shopping_mall_order_id: order.id,
          payment_method: paymentMethod,
          payment_status: paymentStatusCreate,
          payment_amount: paymentAmount,
          transaction_id: paymentTransactionId,
        } satisfies IShoppingMallPayment.ICreate,
      },
    );
  typia.assert(payment);

  // 9. Admin user deletes the payment
  await api.functional.shoppingMall.adminUser.orders.payments.erase(
    connection,
    {
      orderId: order.id,
      paymentId: payment.id,
    },
  );
}
