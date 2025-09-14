import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallChannel } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallChannel";
import type { IShoppingMallDelivery } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallDelivery";
import type { IShoppingMallOrder } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrder";
import type { IShoppingMallSale } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSale";
import type { IShoppingMallSection } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSection";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

export async function test_api_order_delivery_create_success_adminrole(
  connection: api.IConnection,
) {
  // 1. Create and authenticate admin user
  const adminUserCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(10),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminUserCreateBody,
    });
  typia.assert(adminUser);

  // 2. Create and authenticate seller user
  const sellerUserCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password: RandomGenerator.alphaNumeric(10),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    phone_number: null,
    business_registration_number: RandomGenerator.alphaNumeric(12),
  } satisfies IShoppingMallSellerUser.ICreate;

  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: sellerUserCreateBody,
    });
  typia.assert(sellerUser);

  // 3. Authenticate admin user again (simulate role switching as per scenario)
  await api.functional.auth.adminUser.login(connection, {
    body: {
      email: adminUser.email,
      password_hash: adminUserCreateBody.password_hash,
    } satisfies IShoppingMallAdminUser.ILogin,
  });

  // 4. Create sales channel with admin user
  const channelCreateBody = {
    code: RandomGenerator.alphabets(6),
    name: RandomGenerator.name(2),
    description: null,
    status: "active",
  } satisfies IShoppingMallChannel.ICreate;

  const channel: IShoppingMallChannel =
    await api.functional.shoppingMall.adminUser.channels.create(connection, {
      body: channelCreateBody,
    });
  typia.assert(channel);

  // 5. Create section with admin user
  const sectionCreateBody = {
    code: RandomGenerator.alphabets(5),
    name: RandomGenerator.name(2),
    description: null,
    status: "active",
  } satisfies IShoppingMallSection.ICreate;

  const section: IShoppingMallSection =
    await api.functional.shoppingMall.adminUser.sections.create(connection, {
      body: sectionCreateBody,
    });
  typia.assert(section);

  // 6. Authenticate seller user (simulate role switching)
  await api.functional.auth.sellerUser.login(connection, {
    body: {
      email: sellerUser.email,
      password: sellerUserCreateBody.password,
    } satisfies IShoppingMallSellerUser.ILogin,
  });

  // 7. Create a product sale with sellerUser
  const saleCreateBody = {
    shopping_mall_channel_id: channel.id,
    shopping_mall_section_id: section.id,
    shopping_mall_seller_user_id: sellerUser.id,
    code: RandomGenerator.alphaNumeric(8),
    status: "active",
    name: RandomGenerator.name(3),
    description: null,
    price: 9999,
  } satisfies IShoppingMallSale.ICreate;

  const sale: IShoppingMallSale =
    await api.functional.shoppingMall.sellerUser.sales.create(connection, {
      body: saleCreateBody,
    });
  typia.assert(sale);

  // 8. Authenticate admin again for placing order
  await api.functional.auth.adminUser.login(connection, {
    body: {
      email: adminUser.email,
      password_hash: adminUserCreateBody.password_hash,
    } satisfies IShoppingMallAdminUser.ILogin,
  });

  // 9. Create order record using admin user
  const orderCreateBody = {
    shopping_mall_memberuser_id: typia.random<string & tags.Format<"uuid">>(),
    shopping_mall_channel_id: channel.id,
    shopping_mall_section_id: section.id,
    order_code: RandomGenerator.alphaNumeric(10),
    order_status: "pending",
    payment_status: "pending",
    total_price: 9999,
  } satisfies IShoppingMallOrder.ICreate;

  const order: IShoppingMallOrder =
    await api.functional.shoppingMall.adminUser.orders.createOrder(connection, {
      body: orderCreateBody,
    });
  typia.assert(order);

  // 10. Create delivery record for the order
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
      {
        orderId: order.id,
        body: deliveryCreateBody,
      },
    );
  typia.assert(delivery);

  // Validate that delivery has correct order ID
  TestValidator.equals(
    "delivery order id matches",
    delivery.shopping_mall_order_id,
    order.id,
  );
  TestValidator.equals(
    "delivery status is preparing",
    delivery.delivery_status,
    "preparing",
  );
  TestValidator.equals(
    "delivery stage is preparation",
    delivery.delivery_stage,
    "preparation",
  );

  // 11. Negative scenario: Attempt delivery creation with invalid authorization
  // Switch to seller user and expect failure
  await api.functional.auth.sellerUser.login(connection, {
    body: {
      email: sellerUser.email,
      password: sellerUserCreateBody.password,
    } satisfies IShoppingMallSellerUser.ILogin,
  });

  await TestValidator.error(
    "delivery creation should fail with sellerUser role",
    async () => {
      await api.functional.shoppingMall.adminUser.orders.deliveries.create(
        connection,
        {
          orderId: order.id,
          body: deliveryCreateBody,
        },
      );
    },
  );

  // Switch back to adminUser for clean state
  await api.functional.auth.adminUser.login(connection, {
    body: {
      email: adminUser.email,
      password_hash: adminUserCreateBody.password_hash,
    } satisfies IShoppingMallAdminUser.ILogin,
  });
}
