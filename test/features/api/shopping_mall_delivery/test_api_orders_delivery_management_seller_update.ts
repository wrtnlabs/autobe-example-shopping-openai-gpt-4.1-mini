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
 * Validate seller user's ability to update a delivery record for a specific
 * order.
 *
 * Steps:
 *
 * 1. Create and authenticate a seller user.
 * 2. Create a member user to associate with an order.
 * 3. Create an admin user and authenticate.
 * 4. As admin, create a sales channel and a spatial section.
 * 5. Seller creates a sale product linked to the channel and section.
 * 6. Seller creates an order for the member user in the sales channel.
 * 7. Seller creates a delivery record for the order.
 * 8. Seller updates the delivery record with new information.
 * 9. Validate updated delivery response fields.
 *
 * The test ensures correct role-based access, proper API data flow, and
 * verifies that updated delivery records reflect the changes accurately.
 */
export async function test_api_orders_delivery_management_seller_update(
  connection: api.IConnection,
) {
  // 1. Create and authenticate seller user
  const sellerUserEmail = typia.random<string & tags.Format<"email">>();
  const sellerUser = await api.functional.auth.sellerUser.join(connection, {
    body: {
      email: sellerUserEmail,
      password: "SellerPass123!",
      nickname: RandomGenerator.name(),
      full_name: RandomGenerator.name(2),
      phone_number: RandomGenerator.mobile(),
      business_registration_number: `BRN${RandomGenerator.alphaNumeric(9)}`,
    } satisfies IShoppingMallSellerUser.ICreate,
  });
  typia.assert(sellerUser);

  // 2. Create and authenticate member user
  const memberUserEmail = typia.random<string & tags.Format<"email">>();
  const memberUser = await api.functional.auth.memberUser.join(connection, {
    body: {
      email: memberUserEmail,
      password_hash: "MemberPass123!",
      nickname: RandomGenerator.name(),
      full_name: RandomGenerator.name(2),
      phone_number: RandomGenerator.mobile(),
      status: "active",
    } satisfies IShoppingMallMemberUser.ICreate,
  });
  typia.assert(memberUser);

  // 3. Create and authenticate admin user
  const adminUserEmail = typia.random<string & tags.Format<"email">>();
  const adminUser = await api.functional.auth.adminUser.join(connection, {
    body: {
      email: adminUserEmail,
      password_hash: "AdminPass123!",
      nickname: RandomGenerator.name(),
      full_name: RandomGenerator.name(2),
      status: "active",
    } satisfies IShoppingMallAdminUser.ICreate,
  });
  typia.assert(adminUser);

  // 4. As admin, create a sales channel
  await api.functional.auth.adminUser.login(connection, {
    body: {
      email: adminUserEmail,
      password_hash: "AdminPass123!",
    } satisfies IShoppingMallAdminUser.ILogin,
  });
  const channelCode = RandomGenerator.alphaNumeric(8);
  const channel = await api.functional.shoppingMall.adminUser.channels.create(
    connection,
    {
      body: {
        code: channelCode,
        name: `Channel-${channelCode}`,
        description: `Test channel for ${channelCode}`,
        status: "active",
      } satisfies IShoppingMallChannel.ICreate,
    },
  );
  typia.assert(channel);

  // 4b. As admin, create a spatial section
  const sectionCode = RandomGenerator.alphaNumeric(8);
  const section = await api.functional.shoppingMall.adminUser.sections.create(
    connection,
    {
      body: {
        code: sectionCode,
        name: `Section-${sectionCode}`,
        description: `Test section for ${sectionCode}`,
        status: "active",
      } satisfies IShoppingMallSection.ICreate,
    },
  );
  typia.assert(section);

  // Switch back to seller user
  await api.functional.auth.sellerUser.login(connection, {
    body: {
      email: sellerUserEmail,
      password: "SellerPass123!",
    } satisfies IShoppingMallSellerUser.ILogin,
  });

  // 5. Seller creates a sale product linked to channel, section
  const saleCode = `SALE-${RandomGenerator.alphaNumeric(6)}`;
  const sale = await api.functional.shoppingMall.sellerUser.sales.create(
    connection,
    {
      body: {
        shopping_mall_channel_id: channel.id,
        shopping_mall_section_id: section.id,
        shopping_mall_seller_user_id: sellerUser.id,
        code: saleCode,
        status: "active",
        name: `Test product ${saleCode}`,
        description: `Description for ${saleCode}`,
        price: 12345,
      } satisfies IShoppingMallSale.ICreate,
    },
  );
  typia.assert(sale);

  // 6. Seller creates an order for the member user
  const orderCode = `ORDER-${RandomGenerator.alphaNumeric(6)}`;
  const order = await api.functional.shoppingMall.sellerUser.orders.createOrder(
    connection,
    {
      body: {
        shopping_mall_memberuser_id: memberUser.id,
        shopping_mall_channel_id: channel.id,
        shopping_mall_section_id: section.id,
        order_code: orderCode,
        order_status: "pending",
        payment_status: "pending",
        total_price: sale.price,
      } satisfies IShoppingMallOrder.ICreate,
    },
  );
  typia.assert(order);

  // 7. Seller creates a delivery record for the order
  const deliveryStatus = "preparing";
  const deliveryStage = "preparation";
  const deliveryCreateBody = {
    shopping_mall_order_id: order.id,
    delivery_status: deliveryStatus,
    delivery_stage: deliveryStage,
    expected_delivery_date: new Date(
      Date.now() + 7 * 24 * 3600 * 1000,
    ).toISOString(),
    start_time: new Date().toISOString(),
  } satisfies IShoppingMallDelivery.ICreate;
  const delivery =
    await api.functional.shoppingMall.sellerUser.orders.deliveries.create(
      connection,
      {
        orderId: order.id,
        body: deliveryCreateBody,
      },
    );
  typia.assert(delivery);
  TestValidator.equals(
    "delivery status after creation",
    delivery.delivery_status,
    deliveryStatus,
  );
  TestValidator.equals(
    "delivery stage after creation",
    delivery.delivery_stage,
    deliveryStage,
  );

  // 8. Seller updates the delivery record
  const updatedDeliveryStatus = "shipping";
  const updatedDeliveryStage = "shipping";
  const deliveryUpdateBody = {
    delivery_status: updatedDeliveryStatus,
    delivery_stage: updatedDeliveryStage,
    expected_delivery_date: new Date(
      Date.now() + 10 * 24 * 3600 * 1000,
    ).toISOString(),
    start_time: new Date().toISOString(),
    end_time: null,
  } satisfies IShoppingMallDelivery.IUpdate;
  const updatedDelivery =
    await api.functional.shoppingMall.sellerUser.orders.deliveries.update(
      connection,
      {
        orderId: order.id,
        deliveryId: delivery.id,
        body: deliveryUpdateBody,
      },
    );
  typia.assert(updatedDelivery);

  // 9. Verification of updated delivery
  TestValidator.equals(
    "updated delivery status matches",
    updatedDelivery.delivery_status,
    deliveryUpdateBody.delivery_status,
  );
  TestValidator.equals(
    "updated delivery stage matches",
    updatedDelivery.delivery_stage,
    deliveryUpdateBody.delivery_stage,
  );
  TestValidator.equals(
    "updated expected delivery date matches",
    updatedDelivery.expected_delivery_date,
    deliveryUpdateBody.expected_delivery_date,
  );
  TestValidator.equals(
    "updated start time matches",
    updatedDelivery.start_time,
    deliveryUpdateBody.start_time,
  );
  TestValidator.equals(
    "updated end time matches",
    updatedDelivery.end_time,
    deliveryUpdateBody.end_time,
  );
}
