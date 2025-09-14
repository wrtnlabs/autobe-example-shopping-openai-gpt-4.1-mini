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
 * This E2E test validates the retrieval of detailed order information by order
 * ID for an authenticated member user in a shopping mall system with multiple
 * user roles. The test involves a comprehensive setup sequence in which:
 *
 * 1. An admin user is created and authenticated to create a sales channel.
 * 2. A product category and spatial section are created under the channel by the
 *    admin user.
 * 3. A seller user is created and authenticated to create a sales product (sale)
 *    associated with the previously created channel, category, and section.
 * 4. A member user is created and authenticated to place an order for the
 *    previously created sale product.
 *
 * The test then attempts to retrieve the created order's detailed information
 * by its order ID as the authenticated member user. The retrieved data is
 * asserted against the created order data for consistency.
 *
 * Additionally, the test verifies that unauthorized access is denied. This is
 * done by explicit authentication context switching between member user, seller
 * user, and admin user, verifying that only the owning member user can access
 * the order details. Unauthorized access attempts by other user roles should
 * raise errors.
 *
 * This entire business scenario ensures that order retrieval authorization,
 * data integrity, and cross-role access restrictions are properly enforced.
 * Each step includes type-safe data construction, API call awaiting, and typia
 * assertion of responses, with comprehensive TestValidator checks and proper
 * authentication role switching via login operations.
 *
 * All created objects use realistic values constrained by DTO property
 * definitions and descriptions (e.g., email formats, UUIDs, date-time ISO
 * strings, correct enum/status strings). RandomGenerator and typia.random are
 * used for generating valid test data where not explicitly specified. This test
 * guarantees complete coverage of the order retrieval API endpoint for happy
 * path, authorization, and data consistency.
 */
export async function test_api_order_get_successful(
  connection: api.IConnection,
) {
  // 1. Admin user join and authenticate
  const adminEmail = typia.random<string & tags.Format<"email">>();
  const adminPassword = "1234";
  const admin: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: adminEmail,
        password_hash: adminPassword,
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        status: "active",
      },
    });
  typia.assert(admin);

  // 2. Admin creates sales channel
  const channel: IShoppingMallChannel =
    await api.functional.shoppingMall.adminUser.channels.create(connection, {
      body: {
        code: RandomGenerator.alphaNumeric(8),
        name: RandomGenerator.name(),
        description: "Main sales channel",
        status: "active",
      },
    });
  typia.assert(channel);

  // 3. Admin login to switch context
  await api.functional.auth.adminUser.login(connection, {
    body: {
      email: adminEmail,
      password_hash: adminPassword,
    },
  });

  // 4. Admin creates product category
  const category: IShoppingMallCategory =
    await api.functional.shoppingMall.adminUser.categories.create(connection, {
      body: {
        code: RandomGenerator.alphaNumeric(5),
        name: RandomGenerator.name(),
        status: "active",
        description: "Test product category",
      },
    });
  typia.assert(category);

  // 5. Admin creates spatial section
  const section: IShoppingMallSection =
    await api.functional.shoppingMall.adminUser.sections.create(connection, {
      body: {
        code: RandomGenerator.alphaNumeric(5),
        name: RandomGenerator.name(),
        status: "active",
        description: "Main store section",
      },
    });
  typia.assert(section);

  // 6. Seller user join and authenticate
  const sellerEmail = typia.random<string & tags.Format<"email">>();
  const sellerPassword = "1234";
  const seller: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: {
        email: sellerEmail,
        password: sellerPassword,
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        phone_number: RandomGenerator.mobile(),
        business_registration_number: RandomGenerator.alphaNumeric(10),
      },
    });
  typia.assert(seller);

  // 7. Seller login to switch context
  await api.functional.auth.sellerUser.login(connection, {
    body: {
      email: sellerEmail,
      password: sellerPassword,
    },
  });

  // 8. Seller creates sale product
  const saleProduct: IShoppingMallSale =
    await api.functional.shoppingMall.sellerUser.sales.create(connection, {
      body: {
        shopping_mall_channel_id: channel.id,
        shopping_mall_section_id: section.id,
        shopping_mall_seller_user_id: seller.id,
        code: RandomGenerator.alphaNumeric(8),
        status: "active",
        name: RandomGenerator.name(),
        description: "Sample product for testing",
        price: 10000,
      },
    });
  typia.assert(saleProduct);

  // 9. Member user join and authenticate
  const memberEmail = typia.random<string & tags.Format<"email">>();
  const memberPassword = "1234";
  const member: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: {
        email: memberEmail,
        password_hash: memberPassword,
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        phone_number: RandomGenerator.mobile(),
        status: "active",
      },
    });
  typia.assert(member);

  // 10. Member login to switch context
  await api.functional.auth.memberUser.login(connection, {
    body: {
      email: memberEmail,
      password: memberPassword,
    },
  });

  // 11. Create order for member user
  const orderCode = `ORD-${RandomGenerator.alphaNumeric(5)}`;
  const orderStatus = "pending";
  const paymentStatus = "pending";
  const totalPrice = saleProduct.price;
  const order: IShoppingMallOrder =
    await api.functional.shoppingMall.memberUser.orders.createOrder(
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
        },
      },
    );
  typia.assert(order);

  // 12. Retrieve order details as member user
  const orderDetails: IShoppingMallOrder =
    await api.functional.shoppingMall.memberUser.orders.atOrder(connection, {
      orderId: order.id,
    });
  typia.assert(orderDetails);

  // Validate consistency of retrieved order data
  TestValidator.equals("order id", orderDetails.id, order.id);
  TestValidator.equals(
    "member user id",
    orderDetails.shopping_mall_memberuser_id,
    member.id,
  );
  TestValidator.equals(
    "channel id",
    orderDetails.shopping_mall_channel_id,
    channel.id,
  );
  TestValidator.equals(
    "section id",
    orderDetails.shopping_mall_section_id !== undefined &&
      orderDetails.shopping_mall_section_id !== null
      ? orderDetails.shopping_mall_section_id
      : null,
    section.id,
  );
  TestValidator.equals("order code", orderDetails.order_code, orderCode);
  TestValidator.equals("order status", orderDetails.order_status, orderStatus);
  TestValidator.equals(
    "payment status",
    orderDetails.payment_status,
    paymentStatus,
  );
  TestValidator.equals("total price", orderDetails.total_price, totalPrice);

  // 13. Attempt unauthorized order retrieval by seller user
  await api.functional.auth.sellerUser.login(connection, {
    body: {
      email: sellerEmail,
      password: sellerPassword,
    },
  });

  await TestValidator.error("seller cannot access member order", async () => {
    await api.functional.shoppingMall.memberUser.orders.atOrder(connection, {
      orderId: order.id,
    });
  });

  // 14. Attempt unauthorized order retrieval by admin user
  await api.functional.auth.adminUser.login(connection, {
    body: {
      email: adminEmail,
      password_hash: adminPassword,
    },
  });

  await TestValidator.error("admin cannot access member order", async () => {
    await api.functional.shoppingMall.memberUser.orders.atOrder(connection, {
      orderId: order.id,
    });
  });
}
