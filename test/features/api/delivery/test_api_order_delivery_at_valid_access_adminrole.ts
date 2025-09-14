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
 * This test verifies that an authorized admin user can retrieve detailed
 * delivery information for a particular delivery under a specified order.
 * The test involves several setup steps: creating and authenticating an
 * admin user, creating and authenticating a seller user to create channel,
 * section, and a product sale. Next, a member user is created and
 * authenticated to place an order associated with the previously created
 * channel, section, and sale. Then, the admin creates a delivery record
 * using the order ID. Finally, the admin requests the delivery detail using
 * the order ID and delivery ID, and the test validates that the returned
 * delivery data matches the created delivery information. The test also
 * verifies that unauthorized roles (seller and member users) cannot access
 * the delivery detail, receiving authorization errors accordingly. The test
 * uses proper role switching via login operations to change authentication
 * context. All API responses are validated with typia.assert for full type
 * correctness. The test asserts business logic correctness by comparing
 * returned data fields with expected values, including delivery status,
 * stage, expected delivery date, timestamps, and the linkage to the correct
 * order ID. The test also ensures that null or optional properties are
 * explicitly handled. The entire flow reflects a real-world multi-actor
 * e-commerce delivery tracking use case with strict authorization
 * enforcement and data integrity validation.
 */
export async function test_api_order_delivery_at_valid_access_adminrole(
  connection: api.IConnection,
) {
  // 1. Admin user creation
  const adminJoinBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: "SecureAdminPass123!",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;
  const admin: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminJoinBody,
    });
  typia.assert(admin);

  // 2. Admin login
  await api.functional.auth.adminUser.login(connection, {
    body: {
      email: admin.email,
      password_hash: "SecureAdminPass123!",
    } satisfies IShoppingMallAdminUser.ILogin,
  });

  // 3. Seller user creation
  const sellerJoinBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password: "StrongSellerPass123$",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: RandomGenerator.mobile(),
    business_registration_number: `BRN${RandomGenerator.alphaNumeric(9)}`,
  } satisfies IShoppingMallSellerUser.ICreate;
  const seller: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: sellerJoinBody,
    });
  typia.assert(seller);

  // 4. Seller login
  await api.functional.auth.sellerUser.login(connection, {
    body: {
      email: seller.email,
      password: "StrongSellerPass123$",
    } satisfies IShoppingMallSellerUser.ILogin,
  });

  // 5. Admin creates a sales channel
  const channelCreateBody = {
    code: RandomGenerator.alphaNumeric(8),
    name: RandomGenerator.name(),
    description: RandomGenerator.paragraph({ sentences: 3 }),
    status: "active",
  } satisfies IShoppingMallChannel.ICreate;
  const channel: IShoppingMallChannel =
    await api.functional.shoppingMall.adminUser.channels.create(connection, {
      body: channelCreateBody,
    });
  typia.assert(channel);

  // 6. Admin creates a section
  const sectionCreateBody = {
    code: RandomGenerator.alphaNumeric(6),
    name: RandomGenerator.name(),
    description: RandomGenerator.paragraph({ sentences: 2 }),
    status: "active",
  } satisfies IShoppingMallSection.ICreate;
  const section: IShoppingMallSection =
    await api.functional.shoppingMall.adminUser.sections.create(connection, {
      body: sectionCreateBody,
    });
  typia.assert(section);

  // 7. Seller creates a sale (product)
  await api.functional.auth.sellerUser.login(connection, {
    body: {
      email: seller.email,
      password: "StrongSellerPass123$",
    } satisfies IShoppingMallSellerUser.ILogin,
  });

  const saleCreateBody = {
    shopping_mall_channel_id: channel.id,
    shopping_mall_section_id: section.id,
    shopping_mall_seller_user_id: seller.id,
    code: RandomGenerator.alphaNumeric(10),
    status: "active",
    name: RandomGenerator.name(),
    description: RandomGenerator.content({ paragraphs: 1 }),
    price: 10000,
  } satisfies IShoppingMallSale.ICreate;
  const sale: IShoppingMallSale =
    await api.functional.shoppingMall.sellerUser.sales.create(connection, {
      body: saleCreateBody,
    });
  typia.assert(sale);

  // 8. Member user creation
  const memberJoinBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: "MemberPass123!",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: RandomGenerator.mobile(),
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;
  const member: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: memberJoinBody,
    });
  typia.assert(member);

  // 9. Member login
  await api.functional.auth.memberUser.login(connection, {
    body: {
      email: member.email,
      password: "MemberPass123!",
    } satisfies IShoppingMallMemberUser.ILogin,
  });

  // 10. Member places an order
  const orderCreateBody = {
    shopping_mall_memberuser_id: member.id,
    shopping_mall_channel_id: channel.id,
    shopping_mall_section_id: section.id,
    order_code: `ORD${RandomGenerator.alphaNumeric(7)}`,
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

  // 11. Switch back to admin for delivery creation
  await api.functional.auth.adminUser.login(connection, {
    body: {
      email: admin.email,
      password_hash: "SecureAdminPass123!",
    } satisfies IShoppingMallAdminUser.ILogin,
  });

  // 12. Admin creates delivery for the order
  const deliveryCreateBody = {
    shopping_mall_order_id: order.id,
    delivery_status: "preparing",
    delivery_stage: "preparation",
    expected_delivery_date: new Date(
      Date.now() + 5 * 24 * 60 * 60 * 1000,
    ).toISOString(),
    start_time: new Date().toISOString(),
    end_time: null,
  } satisfies IShoppingMallDelivery.ICreate;
  const delivery: IShoppingMallDelivery =
    await api.functional.shoppingMall.adminUser.orders.deliveries.create(
      connection,
      { orderId: order.id, body: deliveryCreateBody },
    );
  typia.assert(delivery);

  // 13. Admin retrieves delivery detail
  const deliveryDetail: IShoppingMallDelivery =
    await api.functional.shoppingMall.adminUser.orders.deliveries.at(
      connection,
      { orderId: order.id, deliveryId: delivery.id },
    );
  typia.assert(deliveryDetail);

  // Validate that retrieved delivery matches the created one
  TestValidator.equals(
    "delivery order ID matches",
    deliveryDetail.shopping_mall_order_id,
    order.id,
  );
  TestValidator.equals("delivery ID matches", deliveryDetail.id, delivery.id);
  TestValidator.equals(
    "delivery status matches",
    deliveryDetail.delivery_status,
    "preparing",
  );
  TestValidator.equals(
    "delivery stage matches",
    deliveryDetail.delivery_stage,
    "preparation",
  );
  TestValidator.equals(
    "expected delivery date matches",
    deliveryDetail.expected_delivery_date,
    deliveryCreateBody.expected_delivery_date,
  );
  TestValidator.equals(
    "start time matches",
    deliveryDetail.start_time,
    deliveryCreateBody.start_time,
  );
  TestValidator.equals("end time matches", deliveryDetail.end_time, null);

  // 14. Test unauthorized access
  // Seller user tries to access delivery detail
  await api.functional.auth.sellerUser.login(connection, {
    body: {
      email: seller.email,
      password: "StrongSellerPass123$",
    } satisfies IShoppingMallSellerUser.ILogin,
  });

  await TestValidator.error(
    "seller role cannot get delivery detail",
    async () => {
      await api.functional.shoppingMall.adminUser.orders.deliveries.at(
        connection,
        { orderId: order.id, deliveryId: delivery.id },
      );
    },
  );

  // Member user tries to access delivery detail
  await api.functional.auth.memberUser.login(connection, {
    body: {
      email: member.email,
      password: "MemberPass123!",
    } satisfies IShoppingMallMemberUser.ILogin,
  });

  await TestValidator.error(
    "member role cannot get delivery detail",
    async () => {
      await api.functional.shoppingMall.adminUser.orders.deliveries.at(
        connection,
        { orderId: order.id, deliveryId: delivery.id },
      );
    },
  );
}
