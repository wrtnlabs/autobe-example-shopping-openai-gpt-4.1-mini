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
 * Validate that an authorized admin user can list deliveries by order with
 * filters and pagination.
 *
 * This test covers multiple user role creations, authentications, sales
 * channel and section setup, sale product creation, order creation under
 * member user context, and delivery record creation.
 *
 * The admin user then retrieves deliveries related to the order and
 * validates pagination, filtering by delivery status and stage, and sorting
 * by created timestamps.
 *
 * This scenario tests end-to-end business logic, authorization, and API
 * filtering correctness. It ensures data integrity and correct access
 * control for delivery listing functionality.
 *
 * Steps:
 *
 * 1. Create and authenticate admin user.
 * 2. Create and authenticate member user.
 * 3. Create and authenticate seller user.
 * 4. Seller logs in.
 * 5. Seller creates sales channel and spatial section.
 * 6. Seller creates a sale product linked to the channel, section, and seller.
 * 7. Admin user logs in to create an order.
 * 8. Admin creates an order linked to member user, channel, and section.
 * 9. Admin creates multiple deliveries for the order with diverse delivery
 *    statuses and stages.
 * 10. Admin lists deliveries by order with filters, pagination, and sorting,
 *     asserting results.
 */
export async function test_api_delivery_list_deliveries_by_order_authorized(
  connection: api.IConnection,
) {
  // 1. Admin user creation
  const adminPassword: string = RandomGenerator.alphaNumeric(12);
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: `admin_${RandomGenerator.alphaNumeric(8)}@example.com`,
        password_hash: adminPassword,
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // Admin user login to refresh session context
  const loggedInAdmin: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.login(connection, {
      body: {
        email: adminUser.email,
        password_hash: adminPassword,
      } satisfies IShoppingMallAdminUser.ILogin,
    });
  typia.assert(loggedInAdmin);

  // 2. Member user creation
  const memberPassword: string = RandomGenerator.alphaNumeric(12);
  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: {
        email: `member_${RandomGenerator.alphaNumeric(8)}@example.com`,
        password_hash: memberPassword,
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        phone_number: null,
        status: "active",
      } satisfies IShoppingMallMemberUser.ICreate,
    });
  typia.assert(memberUser);

  // 3. Seller user creation
  const sellerPassword: string = RandomGenerator.alphaNumeric(12);
  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: {
        email: `seller_${RandomGenerator.alphaNumeric(8)}@example.com`,
        password: sellerPassword,
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        phone_number: null,
        business_registration_number: RandomGenerator.alphaNumeric(12),
      } satisfies IShoppingMallSellerUser.ICreate,
    });
  typia.assert(sellerUser);

  // 4. Seller login to set auth context
  const loggedInSeller: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.login(connection, {
      body: {
        email: sellerUser.email,
        password: sellerPassword,
      } satisfies IShoppingMallSellerUser.ILogin,
    });
  typia.assert(loggedInSeller);

  // 5. Seller creates sales channel
  const channelCode = `ch_${RandomGenerator.alphaNumeric(6)}`;
  const channel: IShoppingMallChannel =
    await api.functional.shoppingMall.adminUser.channels.create(connection, {
      body: {
        code: channelCode,
        name: `Channel ${RandomGenerator.name(1)}`,
        description: null,
        status: "active",
      } satisfies IShoppingMallChannel.ICreate,
    });
  typia.assert(channel);

  // 6. Seller creates spatial section
  const sectionCode = `sec_${RandomGenerator.alphaNumeric(6)}`;
  const section: IShoppingMallSection =
    await api.functional.shoppingMall.adminUser.sections.create(connection, {
      body: {
        code: sectionCode,
        name: `Section ${RandomGenerator.name(1)}`,
        description: null,
        status: "active",
      } satisfies IShoppingMallSection.ICreate,
    });
  typia.assert(section);

  // 7. Seller creates sale product
  const saleProduct: IShoppingMallSale =
    await api.functional.shoppingMall.sellerUser.sales.create(connection, {
      body: {
        shopping_mall_channel_id: channel.id,
        shopping_mall_section_id: section.id,
        shopping_mall_seller_user_id: sellerUser.id,
        code: `sale_${RandomGenerator.alphaNumeric(8)}`,
        status: "active",
        name: `Product ${RandomGenerator.name(2)}`,
        description: null,
        price: Math.floor(Math.random() * 9000) + 1000,
      } satisfies IShoppingMallSale.ICreate,
    });
  typia.assert(saleProduct);

  // 8. Admin user login for order creation context
  const adminLoginContext: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.login(connection, {
      body: {
        email: adminUser.email,
        password_hash: adminPassword,
      } satisfies IShoppingMallAdminUser.ILogin,
    });
  typia.assert(adminLoginContext);

  // 9. Admin user creates order
  const orderCode = `ORD-${RandomGenerator.alphaNumeric(8)}`;
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

  // 10. Admin creates multiple deliveries
  const deliveryStatuses = ["preparing", "shipping", "delivered"] as const;
  const deliveryStages = [
    "preparation",
    "manufacturing",
    "shipping",
    "completed",
  ] as const;

  const deliveries: IShoppingMallDelivery[] = [];

  // Create 5 deliveries with random statuses and stages and varied timestamps
  for (let i = 0; i < 5; i++) {
    const deliveryStatus = RandomGenerator.pick([...deliveryStatuses]);
    const deliveryStage = RandomGenerator.pick([...deliveryStages]);
    const now = new Date();

    const expectedDeliveryDate = new Date(
      now.getTime() + 24 * 60 * 60 * 1000 * (i + 1),
    ).toISOString();
    const startTime = new Date(
      now.getTime() - 60 * 60 * 1000 * (5 - i),
    ).toISOString();
    const endTime = new Date(
      now.getTime() - 60 * 60 * 1000 * (4 - i),
    ).toISOString();

    const delivery =
      await api.functional.shoppingMall.adminUser.orders.deliveries.create(
        connection,
        {
          orderId: order.id,
          body: {
            shopping_mall_order_id: order.id,
            delivery_status: deliveryStatus,
            delivery_stage: deliveryStage,
            expected_delivery_date: expectedDeliveryDate,
            start_time: startTime,
            end_time: endTime,
          } satisfies IShoppingMallDelivery.ICreate,
        },
      );
    typia.assert(delivery);
    deliveries.push(delivery);
  }

  // 11. Admin user lists deliveries without filters
  const deliveriesListAll: IPageIShoppingMallDelivery.ISummary =
    await api.functional.shoppingMall.adminUser.orders.deliveries.index(
      connection,
      {
        orderId: order.id,
        body: {
          delivery_status: null,
          delivery_stage: null,
          page: 0,
          limit: 10,
          orderBy: null,
          orderDirection: null,
        } satisfies IShoppingMallDelivery.IRequest,
      },
    );
  typia.assert(deliveriesListAll);

  TestValidator.predicate(
    "all deliveries pagination limit <= 10",
    deliveriesListAll.pagination.limit <= 10,
  );
  TestValidator.predicate(
    "all deliveries data length <= pagination limit",
    deliveriesListAll.data.length <= deliveriesListAll.pagination.limit,
  );
  // All deliveries belong to the requested order
  for (const delivery of deliveriesListAll.data) {
    TestValidator.equals(
      "delivery belongs to order",
      delivery.shopping_mall_order_id,
      order.id,
    );
  }

  // 12. Filter by delivery_status
  const filterStatus = deliveries[0].delivery_status;
  const filteredByStatus: IPageIShoppingMallDelivery.ISummary =
    await api.functional.shoppingMall.adminUser.orders.deliveries.index(
      connection,
      {
        orderId: order.id,
        body: {
          delivery_status: filterStatus,
          delivery_stage: null,
          page: 0,
          limit: 10,
          orderBy: null,
          orderDirection: null,
        } satisfies IShoppingMallDelivery.IRequest,
      },
    );
  typia.assert(filteredByStatus);

  for (const delivery of filteredByStatus.data) {
    TestValidator.equals(
      "filtered delivery status matches",
      delivery.delivery_status,
      filterStatus,
    );
  }

  // 13. Filter by delivery_stage
  const filterStage = deliveries[0].delivery_stage;
  const filteredByStage: IPageIShoppingMallDelivery.ISummary =
    await api.functional.shoppingMall.adminUser.orders.deliveries.index(
      connection,
      {
        orderId: order.id,
        body: {
          delivery_status: null,
          delivery_stage: filterStage,
          page: 0,
          limit: 10,
          orderBy: null,
          orderDirection: null,
        } satisfies IShoppingMallDelivery.IRequest,
      },
    );
  typia.assert(filteredByStage);

  for (const delivery of filteredByStage.data) {
    TestValidator.equals(
      "filtered delivery stage matches",
      delivery.delivery_stage,
      filterStage,
    );
  }

  // 14. Pagination test - limit to 2 deliveries per page
  const paginatedResult: IPageIShoppingMallDelivery.ISummary =
    await api.functional.shoppingMall.adminUser.orders.deliveries.index(
      connection,
      {
        orderId: order.id,
        body: {
          delivery_status: null,
          delivery_stage: null,
          page: 0,
          limit: 2,
          orderBy: null,
          orderDirection: null,
        } satisfies IShoppingMallDelivery.IRequest,
      },
    );
  typia.assert(paginatedResult);

  TestValidator.equals(
    "pagination limit is 2",
    paginatedResult.pagination.limit,
    2,
  );
  TestValidator.predicate(
    "pagination data length <= 2",
    paginatedResult.data.length <= 2,
  );

  // 15. Sorting tests - orderBy created_at ascending
  const sortedAsc: IPageIShoppingMallDelivery.ISummary =
    await api.functional.shoppingMall.adminUser.orders.deliveries.index(
      connection,
      {
        orderId: order.id,
        body: {
          delivery_status: null,
          delivery_stage: null,
          page: 0,
          limit: 10,
          orderBy: "created_at",
          orderDirection: "asc",
        } satisfies IShoppingMallDelivery.IRequest,
      },
    );
  typia.assert(sortedAsc);

  for (let i = 1; i < sortedAsc.data.length; i++) {
    TestValidator.predicate(
      `ascending created_at order, item ${i - 1} <= item ${i}`,
      new Date(sortedAsc.data[i - 1].created_at) <=
        new Date(sortedAsc.data[i].created_at),
    );
  }

  // orderBy created_at descending
  const sortedDesc: IPageIShoppingMallDelivery.ISummary =
    await api.functional.shoppingMall.adminUser.orders.deliveries.index(
      connection,
      {
        orderId: order.id,
        body: {
          delivery_status: null,
          delivery_stage: null,
          page: 0,
          limit: 10,
          orderBy: "created_at",
          orderDirection: "desc",
        } satisfies IShoppingMallDelivery.IRequest,
      },
    );
  typia.assert(sortedDesc);

  for (let i = 1; i < sortedDesc.data.length; i++) {
    TestValidator.predicate(
      `descending created_at order, item ${i - 1} >= item ${i}`,
      new Date(sortedDesc.data[i - 1].created_at) >=
        new Date(sortedDesc.data[i].created_at),
    );
  }
}
