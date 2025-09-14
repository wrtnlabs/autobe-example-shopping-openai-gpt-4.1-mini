import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallChannel } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallChannel";
import type { IShoppingMallDelivery } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallDelivery";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";
import type { IShoppingMallOrder } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrder";
import type { IShoppingMallSale } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSale";
import type { IShoppingMallSection } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSection";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * This test covers the entire business flow for a seller user retrieving
 * delivery details.
 *
 * Workflow steps:
 *
 * 1. Seller user account join and login to authenticate.
 * 2. Admin user account join and login to authenticate.
 * 3. Admin creates a sales channel with unique code, name, and active status.
 * 4. Admin creates a spatial section with unique code, name, and active status.
 * 5. Seller creates a sale product linked to channel and section, with unique
 *    code, active status, and price.
 * 6. Member user account join and login to authenticate.
 * 7. Member creates an order linked to member user, channel, and section, with
 *    order code, order status 'pending', payment status 'pending', and total
 *    price.
 * 8. Seller creates a delivery record linked to the order with delivery_status
 *    'preparing', delivery_stage 'preparation', expected_delivery_date,
 *    nullable start and end time.
 * 9. Seller fetches the delivery detail via GET endpoint, passing orderId and
 *    deliveryId.
 *
 * Assertions validate response structure and values against created delivery
 * record, using typia.assert and TestValidator.
 *
 * This test ensures proper multi-role authentication, data integrity, and
 * access control for seller users.
 */
export async function test_api_order_delivery_at_valid_access_sellerrole(
  connection: api.IConnection,
) {
  // 1. Seller user joins and authenticates
  const sellerEmail = typia.random<string & tags.Format<"email">>();
  const sellerPassword = "P@ssw0rd123!";
  const sellerJoinBody = {
    email: sellerEmail,
    password: sellerPassword,
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: RandomGenerator.mobile(),
    business_registration_number: RandomGenerator.alphaNumeric(10),
  } satisfies IShoppingMallSellerUser.ICreate;

  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: sellerJoinBody,
    });
  typia.assert(sellerUser);

  // 2. Seller logs in again to make sure auth context is set
  await api.functional.auth.sellerUser.login(connection, {
    body: {
      email: sellerEmail,
      password: sellerPassword,
    } satisfies IShoppingMallSellerUser.ILogin,
  });

  // 3. Admin user joins and authenticates
  const adminEmail = typia.random<string & tags.Format<"email">>();
  const adminPassword = "Adm1nPassw0rd!";
  const adminJoinBody = {
    email: adminEmail,
    password_hash: adminPassword,
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminJoinBody,
    });
  typia.assert(adminUser);

  // 4. Admin logs in to confirm auth context
  await api.functional.auth.adminUser.login(connection, {
    body: {
      email: adminEmail,
      password_hash: adminPassword,
    } satisfies IShoppingMallAdminUser.ILogin,
  });

  // 5. Admin creates a sales channel
  const channelCode = `ch_${RandomGenerator.alphaNumeric(6)}`;
  const channelCreateBody = {
    code: channelCode,
    name: `Channel ${RandomGenerator.name(2)}`,
    description: "Test sales channel",
    status: "active",
  } satisfies IShoppingMallChannel.ICreate;

  const channel: IShoppingMallChannel =
    await api.functional.shoppingMall.adminUser.channels.create(connection, {
      body: channelCreateBody,
    });
  typia.assert(channel);
  TestValidator.equals(
    "created channel code matches",
    channel.code,
    channelCode,
  );

  // 6. Admin creates a spatial section
  const sectionCode = `sec_${RandomGenerator.alphaNumeric(6)}`;
  const sectionCreateBody = {
    code: sectionCode,
    name: `Section ${RandomGenerator.name(2)}`,
    description: "Test spatial section",
    status: "active",
  } satisfies IShoppingMallSection.ICreate;

  const section: IShoppingMallSection =
    await api.functional.shoppingMall.adminUser.sections.create(connection, {
      body: sectionCreateBody,
    });
  typia.assert(section);
  TestValidator.equals(
    "created spatial section code matches",
    section.code,
    sectionCode,
  );

  // 7. Seller creates a sale product linked to channel and section
  const saleCode = `sale_${RandomGenerator.alphaNumeric(6)}`;
  const saleCreateBody = {
    shopping_mall_channel_id: channel.id,
    shopping_mall_section_id: section.id,
    shopping_mall_seller_user_id: sellerUser.id,
    code: saleCode,
    status: "active",
    name: `Sale Product ${RandomGenerator.name(2)}`,
    description: "Test sale product",
    price: 10000,
  } satisfies IShoppingMallSale.ICreate;

  const sale: IShoppingMallSale =
    await api.functional.shoppingMall.sellerUser.sales.create(connection, {
      body: saleCreateBody,
    });
  typia.assert(sale);
  TestValidator.equals("created sale code matches", sale.code, saleCode);

  // 8. Member user joins and authenticates
  const memberEmail = typia.random<string & tags.Format<"email">>();
  const memberPassword = "MemberPass123!";
  const memberJoinBody = {
    email: memberEmail,
    password_hash: memberPassword,
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;

  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: memberJoinBody,
    });
  typia.assert(memberUser);

  // 9. Member logs in
  await api.functional.auth.memberUser.login(connection, {
    body: {
      email: memberEmail,
      password: memberPassword,
    } satisfies IShoppingMallMemberUser.ILogin,
  });

  // 10. Member creates an order linked to sale product
  const orderCode = `order_${RandomGenerator.alphaNumeric(8)}`;
  const orderCreateBody = {
    shopping_mall_memberuser_id: memberUser.id,
    shopping_mall_channel_id: channel.id,
    shopping_mall_section_id: section.id,
    order_code: orderCode,
    order_status: "pending",
    payment_status: "pending",
    total_price: sale.price,
  } satisfies IShoppingMallOrder.ICreate;

  const order: IShoppingMallOrder =
    await api.functional.shoppingMall.memberUser.orders.createOrder(
      connection,
      { body: orderCreateBody },
    );
  typia.assert(order);
  TestValidator.equals(
    "created order code matches",
    order.order_code,
    orderCode,
  );

  // 11. Seller creates a delivery record linked to the order
  const deliveryCreateBody = {
    shopping_mall_order_id: order.id,
    delivery_status: "preparing",
    delivery_stage: "preparation",
    expected_delivery_date: new Date(
      Date.now() + 5 * 24 * 60 * 60 * 1000,
    ).toISOString(), // 5 days from now
    start_time: null,
    end_time: null,
  } satisfies IShoppingMallDelivery.ICreate;

  // Switch to seller login context for delivery create
  await api.functional.auth.sellerUser.login(connection, {
    body: {
      email: sellerEmail,
      password: sellerPassword,
    } satisfies IShoppingMallSellerUser.ILogin,
  });

  const delivery: IShoppingMallDelivery =
    await api.functional.shoppingMall.sellerUser.orders.deliveries.create(
      connection,
      { orderId: order.id, body: deliveryCreateBody },
    );
  typia.assert(delivery);
  TestValidator.equals(
    "delivery order id matches",
    delivery.shopping_mall_order_id,
    order.id,
  );
  TestValidator.equals(
    "delivery stage is preparation",
    delivery.delivery_stage,
    "preparation",
  );

  // 12. Seller fetches the delivery detail using GET endpoint
  const deliveryRead: IShoppingMallDelivery =
    await api.functional.shoppingMall.sellerUser.orders.deliveries.at(
      connection,
      {
        orderId: order.id,
        deliveryId: delivery.id,
      },
    );
  typia.assert(deliveryRead);

  // Validate that fetched delivery data exactly matches the created delivery
  TestValidator.equals(
    "delivery fetched id matches",
    deliveryRead.id,
    delivery.id,
  );
  TestValidator.equals(
    "delivery fetched order id matches",
    deliveryRead.shopping_mall_order_id,
    delivery.shopping_mall_order_id,
  );
  TestValidator.equals(
    "delivery status matches",
    deliveryRead.delivery_status,
    delivery.delivery_status,
  );
  TestValidator.equals(
    "delivery stage matches",
    deliveryRead.delivery_stage,
    delivery.delivery_stage,
  );
  TestValidator.equals(
    "delivery expected date matches",
    deliveryRead.expected_delivery_date,
    delivery.expected_delivery_date,
  );
  TestValidator.equals(
    "delivery start time matches",
    deliveryRead.start_time,
    delivery.start_time,
  );
  TestValidator.equals(
    "delivery end time matches",
    deliveryRead.end_time,
    delivery.end_time,
  );

  // Negative scenario: Try to access delivery detail with memberUser, expect failure
  await api.functional.auth.memberUser.login(connection, {
    body: {
      email: memberEmail,
      password: memberPassword,
    } satisfies IShoppingMallMemberUser.ILogin,
  });
  await TestValidator.error(
    "member user should not access seller delivery detail",
    async () => {
      await api.functional.shoppingMall.sellerUser.orders.deliveries.at(
        connection,
        {
          orderId: order.id,
          deliveryId: delivery.id,
        },
      );
    },
  );

  // Negative scenario: Try to access delivery detail with adminUser, expect failure
  await api.functional.auth.adminUser.login(connection, {
    body: {
      email: adminEmail,
      password_hash: adminPassword,
    } satisfies IShoppingMallAdminUser.ILogin,
  });
  await TestValidator.error(
    "admin user should not access seller delivery detail",
    async () => {
      await api.functional.shoppingMall.sellerUser.orders.deliveries.at(
        connection,
        {
          orderId: order.id,
          deliveryId: delivery.id,
        },
      );
    },
  );
}
