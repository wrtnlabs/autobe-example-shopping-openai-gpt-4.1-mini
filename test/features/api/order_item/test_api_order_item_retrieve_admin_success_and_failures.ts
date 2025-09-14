import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallOrderItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrderItem";

/**
 * Test scenario for retrieving detailed information of a specific order item by
 * an admin user. This test will cover a successful retrieval using valid
 * orderId and orderItemId parameters, verifying all relevant fields including
 * product snapshot linkage, quantity, price, status, and audit timestamps are
 * returned correctly. It will also include failure scenarios such as accessing
 * the order item with non-existent IDs resulting in not found errors, and
 * unauthorized access attempts by non-admin roles resulting in authorization
 * errors. The test will ensure data is consistent with the purchasing context
 * and the member and order state.
 */
export async function test_api_order_item_retrieve_admin_success_and_failures(
  connection: api.IConnection,
) {
  // 1. Admin user creation and login via join
  const adminUserData: IShoppingMallAdminUser.ICreate = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(16),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    status: "active",
  };
  const admin: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminUserData,
    });
  typia.assert(admin);

  // 2. Generate mock order item data
  // Since the API and DTO do not provide creation operations here, we simulate UUIDs
  const existingOrderId = typia.random<string & tags.Format<"uuid">>();
  const existingOrderItemId = typia.random<string & tags.Format<"uuid">>();

  // 3. Success case: Admin retrieves specific order item
  const orderItem: IShoppingMallOrderItem =
    await api.functional.shoppingMall.adminUser.orders.items.at(connection, {
      orderId: existingOrderId,
      orderItemId: existingOrderItemId,
    });
  typia.assert(orderItem);

  // Validate that required fields exist and are formatted correctly
  TestValidator.predicate(
    "id is a uuid format",
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      orderItem.id,
    ),
  );
  TestValidator.equals(
    "orderId matches",
    orderItem.shopping_mall_order_id,
    existingOrderId,
  );
  TestValidator.predicate(
    "order item id format",
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      orderItem.shopping_mall_sale_snapshot_id,
    ),
  );
  TestValidator.predicate(
    "quantity is positive integer",
    Number.isInteger(orderItem.quantity) && orderItem.quantity > 0,
  );
  TestValidator.predicate(
    "price is non-negative",
    typeof orderItem.price === "number" && orderItem.price >= 0,
  );
  TestValidator.predicate(
    "order_item_status is string",
    typeof orderItem.order_item_status === "string",
  );
  // Validate created_at and updated_at as ISO 8601 date-times
  TestValidator.predicate(
    "created_at has valid ISO 8601 date format",
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(
      orderItem.created_at,
    ),
  );
  TestValidator.predicate(
    "updated_at has valid ISO 8601 date format",
    /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d+)?Z$/.test(
      orderItem.updated_at,
    ),
  );

  // 4. Failure cases

  // 4-1. Non-existent orderId
  await TestValidator.error("not found error for invalid orderId", async () => {
    await api.functional.shoppingMall.adminUser.orders.items.at(connection, {
      orderId: typia.random<string & tags.Format<"uuid">>(), // random new UUID
      orderItemId: existingOrderItemId,
    });
  });

  // 4-2. Non-existent orderItemId
  await TestValidator.error(
    "not found error for invalid orderItemId",
    async () => {
      await api.functional.shoppingMall.adminUser.orders.items.at(connection, {
        orderId: existingOrderId,
        orderItemId: typia.random<string & tags.Format<"uuid">>(), // random new UUID
      });
    },
  );

  // 4-3. Unauthorized access by non-admin user
  // Attempt call without admin auth - simulate by creating a connection with empty headers
  const unauthenticatedConnection: api.IConnection = {
    ...connection,
    headers: {},
  };
  await TestValidator.error(
    "authorization error for non-admin user",
    async () => {
      await api.functional.shoppingMall.adminUser.orders.items.at(
        unauthenticatedConnection,
        {
          orderId: existingOrderId,
          orderItemId: existingOrderItemId,
        },
      );
    },
  );
}
