import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallCategory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCategory";
import type { IShoppingMallChannel } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallChannel";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";
import type { IShoppingMallOrder } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrder";
import type { IShoppingMallSale } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSale";
import type { IShoppingMallSection } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSection";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * Test retrieval of detailed order information by order ID for an administrator
 * user.
 *
 * This test covers the full multi-role business workflow in a shopping mall
 * system, including admin setups, seller product creation, member order
 * placement, and admin retrieval of order details.
 *
 * It performs validation of access control, resource correctness, and data
 * integrity across multiple user contexts.
 *
 * Steps:
 *
 * 1. Create and authenticate admin user
 * 2. Create sales channel, category, section
 * 3. Create and authenticate seller user
 * 4. Create product sale under seller user
 * 5. Create and authenticate member user
 * 6. Member user places an order
 * 7. Admin user retrieves order details
 * 8. Verify order detail fields accuracy
 * 9. Verify unauthorized access is denied for non-admin users
 *
 * Validates all API responses with typia.assert and business data correctness
 * with TestValidator.
 */
export async function test_api_order_get_admin_successful(
  connection: api.IConnection,
) {
  // 1. Create admin user and authenticate
  const adminEmail = typia.random<string & tags.Format<"email">>();
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: adminEmail,
        password_hash: "strong_password_1234",
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // 2. Create sales channel under admin context
  const channelCode = RandomGenerator.alphaNumeric(8);
  const channel: IShoppingMallChannel =
    await api.functional.shoppingMall.adminUser.channels.create(connection, {
      body: {
        code: channelCode,
        name: `Channel ${channelCode}`,
        description: "Test sales channel",
        status: "active",
      } satisfies IShoppingMallChannel.ICreate,
    });
  typia.assert(channel);

  // 3. Create category under admin context
  const categoryCode = RandomGenerator.alphaNumeric(8);
  const category: IShoppingMallCategory =
    await api.functional.shoppingMall.adminUser.categories.create(connection, {
      body: {
        code: categoryCode,
        name: `Category ${categoryCode}`,
        status: "active",
        description: "Test product category",
      } satisfies IShoppingMallCategory.ICreate,
    });
  typia.assert(category);

  // 4. Create section under admin context
  const sectionCode = RandomGenerator.alphaNumeric(8);
  const section: IShoppingMallSection =
    await api.functional.shoppingMall.adminUser.sections.create(connection, {
      body: {
        code: sectionCode,
        name: `Section ${sectionCode}`,
        status: "active",
        description: "Test section",
      } satisfies IShoppingMallSection.ICreate,
    });
  typia.assert(section);

  // 5. Create seller user and authenticate
  const sellerEmail = typia.random<string & tags.Format<"email">>();
  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: {
        email: sellerEmail,
        password: "seller_password_123",
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        phone_number: RandomGenerator.mobile(),
        business_registration_number: `BRN${RandomGenerator.alphaNumeric(10)}`,
      } satisfies IShoppingMallSellerUser.ICreate,
    });
  typia.assert(sellerUser);

  // 6. Switch to seller user context (login)
  await api.functional.auth.sellerUser.login(connection, {
    body: {
      email: sellerEmail,
      password: "seller_password_123",
    } satisfies IShoppingMallSellerUser.ILogin,
  });

  // 7. Create product sale under seller user
  const saleCode = RandomGenerator.alphaNumeric(8);
  const salePrice = 1000 + Math.floor(Math.random() * 9000); // realistic price between 1000-10000
  const sale: IShoppingMallSale =
    await api.functional.shoppingMall.sellerUser.sales.create(connection, {
      body: {
        shopping_mall_channel_id: channel.id,
        shopping_mall_section_id: section.id,
        shopping_mall_seller_user_id: sellerUser.id,
        code: saleCode,
        status: "active",
        name: `Product ${saleCode}`,
        description: "Test product sale",
        price: salePrice,
      } satisfies IShoppingMallSale.ICreate,
    });
  typia.assert(sale);

  // 8. Create member user and authenticate
  const memberEmail = typia.random<string & tags.Format<"email">>();
  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: {
        email: memberEmail,
        password_hash: "member_password_123",
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        phone_number: RandomGenerator.mobile(),
        status: "active",
      } satisfies IShoppingMallMemberUser.ICreate,
    });
  typia.assert(memberUser);

  // 9. Switch to member user context (login)
  await api.functional.auth.memberUser.login(connection, {
    body: {
      email: memberEmail,
      password: "member_password_123",
    } satisfies IShoppingMallMemberUser.ILogin,
  });

  // 10. Create an order for the member user
  const orderCode = RandomGenerator.alphaNumeric(16);
  const orderStatus = "pending";
  const paymentStatus = "pending";

  const order: IShoppingMallOrder =
    await api.functional.shoppingMall.memberUser.orders.createOrder(
      connection,
      {
        body: {
          shopping_mall_memberuser_id: memberUser.id,
          shopping_mall_channel_id: channel.id,
          shopping_mall_section_id: section.id,
          order_code: orderCode,
          order_status: orderStatus,
          payment_status: paymentStatus,
          total_price: sale.price,
        } satisfies IShoppingMallOrder.ICreate,
      },
    );
  typia.assert(order);

  // 11. Switch to admin user context (login)
  await api.functional.auth.adminUser.login(connection, {
    body: {
      email: adminEmail,
      password_hash: "strong_password_1234",
    } satisfies IShoppingMallAdminUser.ILogin,
  });

  // 12. Admin user retrieves order detail
  const orderDetail: IShoppingMallOrder =
    await api.functional.shoppingMall.adminUser.orders.atOrder(connection, {
      orderId: order.id,
    });
  typia.assert(orderDetail);

  // 13. Verify order detail fields and values
  TestValidator.equals("order id matches", orderDetail.id, order.id);
  TestValidator.equals(
    "member user id matches",
    orderDetail.shopping_mall_memberuser_id,
    memberUser.id,
  );
  TestValidator.equals(
    "sales channel id matches",
    orderDetail.shopping_mall_channel_id,
    channel.id,
  );
  TestValidator.equals(
    "section id matches",
    orderDetail.shopping_mall_section_id,
    section.id,
  );
  TestValidator.equals("order code matches", orderDetail.order_code, orderCode);
  TestValidator.equals(
    "order status matches",
    orderDetail.order_status,
    orderStatus,
  );
  TestValidator.equals(
    "payment status matches",
    orderDetail.payment_status,
    paymentStatus,
  );
  TestValidator.equals(
    "total price matches",
    orderDetail.total_price,
    sale.price,
  );

  // 14. Verify unauthorized access is denied for seller user
  await api.functional.auth.sellerUser.login(connection, {
    body: {
      email: sellerEmail,
      password: "seller_password_123",
    } satisfies IShoppingMallSellerUser.ILogin,
  });
  await TestValidator.error(
    "seller user should not access admin order detail",
    async () => {
      await api.functional.shoppingMall.adminUser.orders.atOrder(connection, {
        orderId: order.id,
      });
    },
  );

  // 15. Verify unauthorized access is denied for member user
  await api.functional.auth.memberUser.login(connection, {
    body: {
      email: memberEmail,
      password: "member_password_123",
    } satisfies IShoppingMallMemberUser.ILogin,
  });
  await TestValidator.error(
    "member user should not access admin order detail",
    async () => {
      await api.functional.shoppingMall.adminUser.orders.atOrder(connection, {
        orderId: order.id,
      });
    },
  );
}
