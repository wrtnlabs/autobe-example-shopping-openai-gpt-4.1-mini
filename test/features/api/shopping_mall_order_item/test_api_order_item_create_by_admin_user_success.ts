import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallChannel } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallChannel";
import type { IShoppingMallOrder } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrder";
import type { IShoppingMallOrderItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrderItem";
import type { IShoppingMallSale } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSale";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * This test function validates the process of creating an order item under an
 * existing shopping mall order by an admin user. The business context involves
 * multiple actors including an admin user, a seller user, and related entities
 * such as sales channels and products. The test ensures that relevant
 * prerequisites are met via dependency API calls: an admin user is created and
 * authenticated to establish the admin context; then a sales channel is created
 * by the admin; next, a seller user is created and authenticated to allow
 * product creation; then a product is registered by the seller user tied to the
 * created sales channel; an order is created by an admin user referencing
 * necessary members and sales channels. Finally, an order item referencing the
 * created order and product is created by the admin user. The test asserts that
 * all data returned by each API call conforms to expected types and business
 * logic, validating identities, relationships, and basic properties such as
 * quantities and pricing. Each step verifies the data integrity and ensures the
 * successful creation, proper linkage, and accurate reflection of business
 * entities throughout the workflow. The test uses strict DTO type matching and
 * typia.assert() calls for type safety. It includes realistic randomized data
 * generation in compliance with property descriptions and format constraints.
 * This comprehensive end-to-end test confirms the correctness of order item
 * creation functionality under the admin user's context within a multi-role
 * ecommerce system environment.
 */
export async function test_api_order_item_create_by_admin_user_success(
  connection: api.IConnection,
) {
  // Step 1: Create and authenticate an admin user
  const adminUserCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(20),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminUserCreateBody,
    });
  typia.assert(adminUser);

  // Step 2: Create a sales channel by the admin user
  const channelCreateBody = {
    code: RandomGenerator.alphaNumeric(16),
    name: RandomGenerator.name(),
    description: null,
    status: "active",
  } satisfies IShoppingMallChannel.ICreate;
  const channel: IShoppingMallChannel =
    await api.functional.shoppingMall.adminUser.channels.create(connection, {
      body: channelCreateBody,
    });
  typia.assert(channel);

  // Step 3: Create and authenticate a seller user
  const sellerUserCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password: RandomGenerator.alphaNumeric(20),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    phone_number: null,
    business_registration_number: RandomGenerator.alphaNumeric(10),
  } satisfies IShoppingMallSellerUser.ICreate;
  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: sellerUserCreateBody,
    });
  typia.assert(sellerUser);

  // Step 4: Create a product (sales item) by the seller user
  await api.functional.auth.sellerUser.login(connection, {
    body: {
      email: sellerUser.email,
      password: sellerUserCreateBody.password,
    } satisfies IShoppingMallSellerUser.ILogin,
  });
  const productCreateBody = {
    shopping_mall_channel_id: channel.id,
    shopping_mall_section_id: null,
    shopping_mall_seller_user_id: sellerUser.id,
    code: RandomGenerator.alphaNumeric(10),
    status: "active",
    name: RandomGenerator.name(),
    description: null,
    price: Math.floor(Math.random() * 90000) + 10000,
  } satisfies IShoppingMallSale.ICreate;
  const product: IShoppingMallSale =
    await api.functional.shoppingMall.sellerUser.sales.create(connection, {
      body: productCreateBody,
    });
  typia.assert(product);

  // Step 5: Switch back to admin user for order creation
  await api.functional.auth.adminUser.login(connection, {
    body: {
      email: adminUser.email,
      password_hash: adminUserCreateBody.password_hash,
    } satisfies IShoppingMallAdminUser.ILogin,
  });

  // Step 6: Create an order by admin user
  const orderCreateBody = {
    shopping_mall_memberuser_id: typia.random<string & tags.Format<"uuid">>(),
    shopping_mall_channel_id: channel.id,
    shopping_mall_section_id: null,
    order_code: RandomGenerator.alphaNumeric(16),
    order_status: "pending",
    payment_status: "pending",
    total_price: 100000,
  } satisfies IShoppingMallOrder.ICreate;
  const order: IShoppingMallOrder =
    await api.functional.shoppingMall.adminUser.orders.createOrder(connection, {
      body: orderCreateBody,
    });
  typia.assert(order);

  // Step 7: Create the order item referencing the created order and product
  const orderItemCreateBody = {
    shopping_mall_order_id: order.id,
    shopping_mall_sale_snapshot_id: product.id,
    quantity: 1,
    price: product.price,
    order_item_status: "pending",
  } satisfies IShoppingMallOrderItem.ICreate;
  const orderItem: IShoppingMallOrderItem =
    await api.functional.shoppingMall.adminUser.orders.items.create(
      connection,
      {
        orderId: order.id,
        body: orderItemCreateBody,
      },
    );
  typia.assert(orderItem);

  // Validation of linkages
  TestValidator.equals(
    "order ID match",
    orderItem.shopping_mall_order_id,
    order.id,
  );
  TestValidator.equals(
    "product ID reference",
    orderItem.shopping_mall_sale_snapshot_id,
    product.id,
  );
  TestValidator.equals("order item price", orderItem.price, product.price);
  TestValidator.predicate(
    "quantity should be positive",
    orderItem.quantity > 0,
  );
}
