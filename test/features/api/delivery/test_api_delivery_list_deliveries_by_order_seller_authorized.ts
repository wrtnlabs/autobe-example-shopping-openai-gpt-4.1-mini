import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallDelivery } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallDelivery";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallChannel } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallChannel";
import type { IShoppingMallDelivery } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallDelivery";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";
import type { IShoppingMallOrder } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrder";
import type { IShoppingMallSale } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSale";
import type { IShoppingMallSection } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSection";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * This test function performs a comprehensive E2E test for the delivery
 * listing API for sellers by order ID. It includes multi-role
 * authentication and system setup, sales channel and section creation, sale
 * product creation by a seller, order creation by admin for a member user,
 * multiple delivery creations for the order, role switching to seller user,
 * and finally the seller querying deliveries with pagination and filtering.
 * Every response is asserted for type safety and correctness. Stepwise
 * validation ensures authorization correctness, proper data filtering,
 * pagination controls, and business logic adherence in delivery retrieval.
 */
export async function test_api_delivery_list_deliveries_by_order_seller_authorized(
  connection: api.IConnection,
) {
  // 1. Seller user joins the system
  const sellerUserCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password: RandomGenerator.alphaNumeric(12),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: RandomGenerator.mobile(),
    business_registration_number: RandomGenerator.alphaNumeric(10),
  } satisfies IShoppingMallSellerUser.ICreate;
  const sellerUser = await api.functional.auth.sellerUser.join(connection, {
    body: sellerUserCreateBody,
  });
  typia.assert(sellerUser);

  // 2. Member user joins the system
  const memberUserCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(12),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: RandomGenerator.mobile(),
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;
  const memberUser = await api.functional.auth.memberUser.join(connection, {
    body: memberUserCreateBody,
  });
  typia.assert(memberUser);

  // 3. Admin user joins the system
  const adminUserCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(16),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;
  const adminUser = await api.functional.auth.adminUser.join(connection, {
    body: adminUserCreateBody,
  });
  typia.assert(adminUser);

  // 4. Admin user creates a sales channel
  const channelCreateBody = {
    code: RandomGenerator.alphaNumeric(6),
    name: RandomGenerator.name(),
    description: RandomGenerator.paragraph({ sentences: 5 }),
    status: "active",
  } satisfies IShoppingMallChannel.ICreate;
  const channel = await api.functional.shoppingMall.adminUser.channels.create(
    connection,
    { body: channelCreateBody },
  );
  typia.assert(channel);

  // 5. Admin user creates a spatial section
  const sectionCreateBody = {
    code: RandomGenerator.alphaNumeric(6),
    name: RandomGenerator.name(),
    description: RandomGenerator.paragraph({ sentences: 5 }),
    status: "active",
  } satisfies IShoppingMallSection.ICreate;
  const section = await api.functional.shoppingMall.adminUser.sections.create(
    connection,
    { body: sectionCreateBody },
  );
  typia.assert(section);

  // 6. Seller user creates a sale product linked to channel, section, and seller
  const saleCreateBody = {
    shopping_mall_channel_id: channel.id,
    shopping_mall_section_id: section.id,
    shopping_mall_seller_user_id: sellerUser.id,
    code: RandomGenerator.alphaNumeric(8),
    status: "active",
    name: RandomGenerator.name(2),
    description: RandomGenerator.content({ paragraphs: 2 }),
    price: 10000,
  } satisfies IShoppingMallSale.ICreate;
  const sale = await api.functional.shoppingMall.sellerUser.sales.create(
    connection,
    { body: saleCreateBody },
  );
  typia.assert(sale);

  // 7. Admin user creates an order for member user on the channel and section
  const orderCreateBody = {
    shopping_mall_memberuser_id: memberUser.id,
    shopping_mall_channel_id: channel.id,
    shopping_mall_section_id: section.id,
    order_code: RandomGenerator.alphaNumeric(12),
    order_status: "pending",
    payment_status: "unpaid",
    total_price: 10000,
  } satisfies IShoppingMallOrder.ICreate;
  const order = await api.functional.shoppingMall.adminUser.orders.createOrder(
    connection,
    { body: orderCreateBody },
  );
  typia.assert(order);

  // 8. Admin user creates multiple delivery records for the created order
  const deliveries: IShoppingMallDelivery[] = [];
  const statuses = ["preparing", "shipping", "delivered"] as const;
  const stages = [
    "preparation",
    "manufacturing",
    "shipping",
    "completed",
  ] as const;

  for (let i = 0; i < 3; ++i) {
    const deliveryCreateBody = {
      shopping_mall_order_id: order.id,
      delivery_status: statuses[i % statuses.length],
      delivery_stage: stages[i % stages.length],
      expected_delivery_date: new Date(
        Date.now() + (i + 1) * 24 * 60 * 60 * 1000,
      ).toISOString(),
      start_time: new Date(Date.now() + i * 12 * 60 * 60 * 1000).toISOString(),
      end_time: new Date(
        Date.now() + (i + 1) * 12 * 60 * 60 * 1000,
      ).toISOString(),
    } satisfies IShoppingMallDelivery.ICreate;
    const delivery =
      await api.functional.shoppingMall.adminUser.orders.deliveries.create(
        connection,
        { orderId: order.id, body: deliveryCreateBody },
      );
    typia.assert(delivery);
    deliveries.push(delivery);
  }

  // 9. Seller user logs in to switch authorization context
  const sellerLoginBody = {
    email: sellerUser.email,
    password: sellerUserCreateBody.password,
  } satisfies IShoppingMallSellerUser.ILogin;
  const sellerLoggedIn = await api.functional.auth.sellerUser.login(
    connection,
    { body: sellerLoginBody },
  );
  typia.assert(sellerLoggedIn);

  // 10. Seller user requests paged delivery listings filtered by order id
  // with some filtering fields set
  const deliveryListRequestBody = {
    delivery_status: "shipping",
    delivery_stage: "shipping",
    page: 1,
    limit: 2,
    orderBy: "created_at",
    orderDirection: "asc",
  } satisfies IShoppingMallDelivery.IRequest;
  const deliveryPage: IPageIShoppingMallDelivery.ISummary =
    await api.functional.shoppingMall.sellerUser.orders.deliveries.index(
      connection,
      { orderId: order.id, body: deliveryListRequestBody },
    );
  typia.assert(deliveryPage);

  // 11. Validate returned page information
  TestValidator.predicate(
    "page current is 1",
    deliveryPage.pagination.current === 1,
  );
  TestValidator.predicate(
    "page limit is 2",
    deliveryPage.pagination.limit === 2,
  );
  TestValidator.predicate(
    "page records count matches or exceeds data length",
    deliveryPage.pagination.records >= deliveryPage.data.length,
  );
  TestValidator.predicate(
    "page pages is positive",
    deliveryPage.pagination.pages > 0,
  );

  // 12. Validate filtered deliveries returned match criteria
  for (const deliverySummary of deliveryPage.data) {
    TestValidator.equals(
      "delivery summary status matches filter",
      deliverySummary.delivery_status,
      "shipping",
    );
    TestValidator.equals(
      "delivery summary stage matches filter",
      deliverySummary.delivery_stage,
      "shipping",
    );
    TestValidator.equals(
      "delivery summary order id matches",
      deliverySummary.shopping_mall_order_id,
      order.id,
    );
  }
}
