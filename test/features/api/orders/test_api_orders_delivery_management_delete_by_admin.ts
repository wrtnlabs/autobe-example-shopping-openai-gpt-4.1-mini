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
 * Test the capability of the admin user to hard delete a delivery record
 * associated with an order.
 *
 * This comprehensive test involves multiple user roles and entities:
 *
 * - Admin user creation and authentication
 * - Member user creation to act as the order placer
 * - Sales channel and spatial section creation by admin user
 * - Seller user creation and authentication
 * - Product (sale) creation by seller user
 * - Order creation by admin user associating member, channel, and section
 * - Delivery record creation by admin user
 * - Hard deletion of the delivery record by admin user
 *
 * Steps:
 *
 * 1. Create and authenticate admin user
 * 2. Create member user
 * 3. Create sales channel
 * 4. Create spatial section
 * 5. Create and authenticate seller user
 * 6. Seller creates a product with the channel and section
 * 7. Admin creates an order for the member user with channel and section
 * 8. Admin creates a delivery record for the order
 * 9. Admin deletes the delivery record
 * 10. Validate that the delivery record is removed and order integrity remains
 */
export async function test_api_orders_delivery_management_delete_by_admin(
  connection: api.IConnection,
) {
  // 1. Create and authenticate admin user
  const adminEmail: string = typia.random<string & tags.Format<"email">>();
  const adminPassword: string = "password1234";
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: adminEmail,
        password_hash: adminPassword,
        nickname: RandomGenerator.name(2),
        full_name: RandomGenerator.name(2),
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // 2. Create member user
  const memberEmail: string = typia.random<string & tags.Format<"email">>();
  const memberPassword: string = "password1234";
  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: {
        email: memberEmail,
        password_hash: memberPassword,
        nickname: RandomGenerator.name(1),
        full_name: RandomGenerator.name(2),
        status: "active",
      } satisfies IShoppingMallMemberUser.ICreate,
    });
  typia.assert(memberUser);

  // 3. Create sales channel
  const channelCode = RandomGenerator.alphabets(5);
  const channel: IShoppingMallChannel =
    await api.functional.shoppingMall.adminUser.channels.create(connection, {
      body: {
        code: channelCode,
        name: `Channel ${channelCode.toUpperCase()}`,
        description: "Test channel",
        status: "active",
      } satisfies IShoppingMallChannel.ICreate,
    });
  typia.assert(channel);

  // 4. Create spatial section
  const sectionCode = RandomGenerator.alphabets(4);
  const section: IShoppingMallSection =
    await api.functional.shoppingMall.adminUser.sections.create(connection, {
      body: {
        code: sectionCode,
        name: `Section ${sectionCode.toUpperCase()}`,
        description: "Test section",
        status: "active",
      } satisfies IShoppingMallSection.ICreate,
    });
  typia.assert(section);

  // 5. Create and authenticate seller user
  const sellerEmail: string = typia.random<string & tags.Format<"email">>();
  const sellerPassword: string = "password1234";
  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: {
        email: sellerEmail,
        password: sellerPassword,
        nickname: RandomGenerator.name(2),
        full_name: RandomGenerator.name(2),
        phone_number: RandomGenerator.mobile(),
        business_registration_number: `BRN${RandomGenerator.alphaNumeric(8).toUpperCase()}`,
      } satisfies IShoppingMallSellerUser.ICreate,
    });
  typia.assert(sellerUser);

  await api.functional.auth.sellerUser.login(connection, {
    body: {
      email: sellerEmail,
      password: sellerPassword,
    } satisfies IShoppingMallSellerUser.ILogin,
  });

  // 6. Seller creates a product with the channel and section
  const saleCode = RandomGenerator.alphaNumeric(6).toUpperCase();
  const sale: IShoppingMallSale =
    await api.functional.shoppingMall.sellerUser.sales.create(connection, {
      body: {
        shopping_mall_channel_id: channel.id,
        shopping_mall_section_id: section.id,
        shopping_mall_seller_user_id: sellerUser.id,
        code: saleCode,
        status: "active",
        name: `Product ${saleCode}`,
        description: "Test product",
        price: 10000,
      } satisfies IShoppingMallSale.ICreate,
    });
  typia.assert(sale);

  // Switch back to admin user for order creation
  await api.functional.auth.adminUser.login(connection, {
    body: {
      email: adminEmail,
      password_hash: adminPassword,
    } satisfies IShoppingMallAdminUser.ILogin,
  });

  // 7. Admin creates an order for the member user with channel and section
  const orderCode = RandomGenerator.alphaNumeric(8).toUpperCase();
  const order: IShoppingMallOrder =
    await api.functional.shoppingMall.adminUser.orders.createOrder(connection, {
      body: {
        shopping_mall_memberuser_id: memberUser.id,
        shopping_mall_channel_id: channel.id,
        shopping_mall_section_id: section.id,
        order_code: orderCode,
        order_status: "pending",
        payment_status: "pending",
        total_price: 10000,
      } satisfies IShoppingMallOrder.ICreate,
    });
  typia.assert(order);

  // 8. Admin creates a delivery record for the order
  const deliveryStatus = "preparing";
  const deliveryStage = "preparation";
  const delivery: IShoppingMallDelivery =
    await api.functional.shoppingMall.adminUser.orders.deliveries.create(
      connection,
      {
        orderId: order.id,
        body: {
          shopping_mall_order_id: order.id,
          delivery_status: deliveryStatus,
          delivery_stage: deliveryStage,
          expected_delivery_date: new Date(Date.now() + 86400000).toISOString(), // tomorrow
          start_time: new Date().toISOString(),
          end_time: null,
        } satisfies IShoppingMallDelivery.ICreate,
      },
    );
  typia.assert(delivery);

  // 9. Admin deletes the delivery record
  await api.functional.shoppingMall.adminUser.orders.deliveries.erase(
    connection,
    {
      orderId: order.id,
      deliveryId: delivery.id,
    },
  );

  // 10. Validate that the delivery record is removed and order integrity remains

  // Attempt to delete the same delivery again should cause an error
  await TestValidator.error(
    "Deleting same delivery twice should fail",
    async () => {
      await api.functional.shoppingMall.adminUser.orders.deliveries.erase(
        connection,
        {
          orderId: order.id,
          deliveryId: delivery.id,
        },
      );
    },
  );
}
