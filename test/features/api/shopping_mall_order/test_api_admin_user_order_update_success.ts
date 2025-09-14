import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallOrder } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrder";

/**
 * Test the update of an existing order by an admin user, verifying admin
 * authentication via join operation.
 *
 * The test authenticates as an admin user, then generates updated order data
 * adhering to business constraints. It sends a PUT request to update the order
 * identified by orderId with the new data. After receiving the response, the
 * test validates that all updated fields reflect the input accurately, and
 * verifies that the timestamps created_at and updated_at are present and
 * valid.
 *
 * This test ensures the order update functionality works correctly with proper
 * authorization and data integrity.
 */
export async function test_api_admin_user_order_update_success(
  connection: api.IConnection,
) {
  // 1. Admin user joins (authentication)
  const adminCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(32),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const adminAuthorized: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminCreateBody,
    });
  typia.assert(adminAuthorized);

  // 2. Prepare updated order data
  const updatedOrderBody = {
    shopping_mall_memberuser_id: typia.random<string & tags.Format<"uuid">>(),
    shopping_mall_channel_id: typia.random<string & tags.Format<"uuid">>(),
    shopping_mall_section_id: RandomGenerator.pick([
      typia.random<string & tags.Format<"uuid">>(),
      null,
    ]),
    order_code: RandomGenerator.alphaNumeric(10),
    order_status: RandomGenerator.pick([
      "pending",
      "confirmed",
      "shipped",
      "delivered",
      "cancelled",
    ] as const),
    payment_status: RandomGenerator.pick([
      "pending",
      "paid",
      "cancelled",
    ] as const),
    total_price: Math.round(RandomGenerator.alphaNumeric(3).length * 100 + 100),
    // Not setting deleted_at, treated as undefined meaning no soft deletion
  } satisfies IShoppingMallOrder.IUpdate;

  // 3. Call updateOrder API
  const orderId = typia.random<string & tags.Format<"uuid">>();
  const updatedOrder: IShoppingMallOrder =
    await api.functional.shoppingMall.adminUser.orders.updateOrder(connection, {
      orderId: orderId,
      body: updatedOrderBody,
    });
  typia.assert(updatedOrder);

  // 4. Assert the returned order matches the update data
  TestValidator.equals(
    "updated order's member user ID",
    updatedOrder.shopping_mall_memberuser_id,
    updatedOrderBody.shopping_mall_memberuser_id,
  );
  TestValidator.equals(
    "updated order's channel ID",
    updatedOrder.shopping_mall_channel_id,
    updatedOrderBody.shopping_mall_channel_id,
  );
  TestValidator.equals(
    "updated order's section ID",
    updatedOrder.shopping_mall_section_id,
    updatedOrderBody.shopping_mall_section_id,
  );
  TestValidator.equals(
    "updated order's order code",
    updatedOrder.order_code,
    updatedOrderBody.order_code,
  );
  TestValidator.equals(
    "updated order's order status",
    updatedOrder.order_status,
    updatedOrderBody.order_status,
  );
  TestValidator.equals(
    "updated order's payment status",
    updatedOrder.payment_status,
    updatedOrderBody.payment_status,
  );
  TestValidator.equals(
    "updated order's total price",
    updatedOrder.total_price,
    updatedOrderBody.total_price,
  );

  TestValidator.predicate(
    "updated order has created_at timestamp",
    typeof updatedOrder.created_at === "string" &&
      updatedOrder.created_at.length > 0,
  );
  TestValidator.predicate(
    "updated order has updated_at timestamp",
    typeof updatedOrder.updated_at === "string" &&
      updatedOrder.updated_at.length > 0,
  );
}
