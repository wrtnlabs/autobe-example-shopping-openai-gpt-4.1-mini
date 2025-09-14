import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallOrderItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallOrderItem";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";
import type { IShoppingMallOrder } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrder";
import type { IShoppingMallOrderItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrderItem";

/**
 * Test retrieving order items list for admin user role.
 *
 * This E2E test covers the full workflow:
 *
 * 1. Admin user joins and authenticates.
 * 2. Member user joins and logs in.
 * 3. Member user creates an order.
 * 4. Member user adds order items.
 * 5. Admin user logs in and queries order items list.
 *
 * The test validates authentication role switching, creation of realistic data,
 * and response pagination.
 */
export async function test_api_order_item_list_adminuser_success(
  connection: api.IConnection,
) {
  // 1. Admin user joins the system
  const adminUserEmail: string = typia.random<string & tags.Format<"email">>();
  const adminUserPassword = RandomGenerator.alphaNumeric(12);
  const adminUserJoinBody = {
    email: adminUserEmail,
    password_hash: adminUserPassword,
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminUserJoinBody,
    });
  typia.assert(adminUser);

  // 2. Member user joins the system
  const memberUserEmail: string = typia.random<string & tags.Format<"email">>();
  const memberUserPassword = RandomGenerator.alphaNumeric(12);
  const memberUserJoinBody = {
    email: memberUserEmail,
    password_hash: memberUserPassword,
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: null, // Allowing explicit null
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;

  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: memberUserJoinBody,
    });
  typia.assert(memberUser);

  // 3. Member user logs in
  const memberUserLoginBody = {
    email: memberUserEmail,
    password: memberUserPassword,
  } satisfies IShoppingMallMemberUser.ILogin;

  const memberUserLogin: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.login(connection, {
      body: memberUserLoginBody,
    });
  typia.assert(memberUserLogin);

  // 4. Member user creates an order
  // Using realistic order data
  const orderCreateBody = {
    shopping_mall_memberuser_id: memberUser.id,
    shopping_mall_channel_id: typia.random<string & tags.Format<"uuid">>(),
    shopping_mall_section_id: null,
    order_code: RandomGenerator.alphaNumeric(10),
    order_status: "pending",
    payment_status: "pending",
    total_price: 100000, // realistic price
  } satisfies IShoppingMallOrder.ICreate;

  const order: IShoppingMallOrder =
    await api.functional.shoppingMall.memberUser.orders.createOrder(
      connection,
      { body: orderCreateBody },
    );
  typia.assert(order);

  // 5. Member user adds multiple order items
  // Generate 3 order items
  const orderItems: IShoppingMallOrderItem[] = [];

  for (let i = 0; i < 3; ++i) {
    const orderItemCreateBody = {
      shopping_mall_order_id: order.id,
      shopping_mall_sale_snapshot_id: typia.random<
        string & tags.Format<"uuid">
      >(),
      quantity: 1, // fixed quantity
      price: 30000 + i * 1000, // Increasing price
      order_item_status: "pending",
    } satisfies IShoppingMallOrderItem.ICreate;

    const orderItem =
      await api.functional.shoppingMall.memberUser.orders.items.create(
        connection,
        {
          orderId: order.id,
          body: orderItemCreateBody,
        },
      );
    typia.assert(orderItem);
    orderItems.push(orderItem);
  }

  // 6. Admin user logs in to switch authentication
  const adminUserLoginBody = {
    email: adminUserEmail,
    password_hash: adminUserPassword,
  } satisfies IShoppingMallAdminUser.ILogin;

  const adminUserLogin: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.login(connection, {
      body: adminUserLoginBody,
    });
  typia.assert(adminUserLogin);

  // 7. Admin user queries order items list for the created order
  const orderItemsPage: IPageIShoppingMallOrderItem =
    await api.functional.shoppingMall.adminUser.orders.items.indexOrderItems(
      connection,
      { orderId: order.id },
    );
  typia.assert(orderItemsPage);

  // 8. Validate pagination data and contents
  TestValidator.predicate(
    "pagination is valid",
    orderItemsPage.pagination.current >= 0 &&
      orderItemsPage.pagination.limit > 0 &&
      orderItemsPage.pagination.records >= orderItemsPage.data.length &&
      orderItemsPage.pagination.pages >= 1,
  );

  for (const item of orderItemsPage.data) {
    TestValidator.predicate(
      "order item belongs to order",
      item.shopping_mall_order_id === order.id,
    );
    TestValidator.predicate(
      "order item status valid",
      ["pending", "shipped", "returned"].includes(item.order_item_status),
    );
  }
  // Additional check: All created order items must appear
  const createdIds = new Set(orderItems.map((o) => o.id));
  for (const item of orderItemsPage.data) {
    TestValidator.predicate(
      "created order items included",
      createdIds.has(item.id),
    );
  }
}
