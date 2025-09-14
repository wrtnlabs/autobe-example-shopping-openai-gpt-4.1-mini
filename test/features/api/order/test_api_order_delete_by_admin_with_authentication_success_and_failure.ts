import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallOrder } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrder";

/**
 * This test function performs a full e2e test for permanent deletion of
 * orders by an authenticated admin user.
 *
 * 1. Admin user joins (creates an admin account), authenticating as admin.
 * 2. Using the authenticated admin context, an order is created with realistic
 *    order data.
 * 3. The created order is then deleted via the delete endpoint.
 * 4. Success is validated by the absence of errors and typia.assert checks.
 * 5. The test then attempts to delete a non-existent order and expects an
 *    error.
 * 6. Authorization failure scenario is omitted here because all operations use
 *    the same authenticated admin user context.
 *
 * This scenario validates key admin functionalities around order deletion
 * and error handling for non-existent orders.
 */
export async function test_api_order_delete_by_admin_with_authentication_success_and_failure(
  connection: api.IConnection,
) {
  // Step 1: Admin user joins and authenticates
  const adminEmail: string = typia.random<string & tags.Format<"email">>();
  const adminPasswordHash: string = RandomGenerator.alphaNumeric(64); // Simulated password hash
  const adminCreationBody = {
    email: adminEmail,
    password_hash: adminPasswordHash,
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const adminAuthorized: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminCreationBody,
    });
  typia.assert(adminAuthorized);

  // Step 2: Create a new order as admin user
  // Requirement: supply required fields with realistic data
  const orderCreationBody = {
    shopping_mall_memberuser_id: typia.random<string & tags.Format<"uuid">>(),
    shopping_mall_channel_id: typia.random<string & tags.Format<"uuid">>(),
    shopping_mall_section_id: null, // explicit null per schema
    order_code: `OC-${RandomGenerator.alphaNumeric(10).toUpperCase()}`,
    order_status: "pending",
    payment_status: "pending",
    total_price: 10000,
  } satisfies IShoppingMallOrder.ICreate;

  const createdOrder: IShoppingMallOrder =
    await api.functional.shoppingMall.adminUser.orders.createOrder(connection, {
      body: orderCreationBody,
    });
  typia.assert(createdOrder);

  TestValidator.equals(
    "created order code matches input",
    createdOrder.order_code,
    orderCreationBody.order_code,
  );

  // Step 3: Delete the created order
  await api.functional.shoppingMall.adminUser.orders.eraseOrder(connection, {
    orderId: createdOrder.id,
  });

  // If no exceptions are thrown until here, deletion is successful

  // Step 4: Attempt to delete a non-existent order (random UUID)
  let nonExistentOrderId = typia.random<string & tags.Format<"uuid">>();
  if (nonExistentOrderId === createdOrder.id) {
    // ensure it is really non-existent
    nonExistentOrderId = typia.random<string & tags.Format<"uuid">>();
  }

  await TestValidator.error(
    "deleting non-existent order should fail",
    async () => {
      await api.functional.shoppingMall.adminUser.orders.eraseOrder(
        connection,
        { orderId: nonExistentOrderId },
      );
    },
  );
}
