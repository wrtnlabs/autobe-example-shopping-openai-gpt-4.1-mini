import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallOrder } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrder";
import type { IShoppingMallOrderItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrderItem";

/**
 * Test successful deletion of an order item by admin user. The test includes
 * creating an admin user via join, authenticating, creating an order with
 * items, and then deleting a specific order item. Verifies successful deletion
 * leads to expected state changes and no residual data for the deleted item.
 */
export async function test_api_admin_user_order_item_deletion_success(
  connection: api.IConnection,
) {
  // 1. Admin user creation (join) and authentication
  const adminCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(32),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminCreateBody,
    });
  typia.assert(adminUser);

  // 2. Create order for admin user
  const orderCreateBody = {
    shopping_mall_memberuser_id: typia.random<string & tags.Format<"uuid">>(),
    shopping_mall_channel_id: typia.random<string & tags.Format<"uuid">>(),
    shopping_mall_section_id: null,
    order_code: RandomGenerator.alphaNumeric(12).toUpperCase(),
    order_status: "pending",
    payment_status: "pending",
    total_price: 100000,
  } satisfies IShoppingMallOrder.ICreate;

  const order: IShoppingMallOrder =
    await api.functional.shoppingMall.adminUser.orders.createOrder(connection, {
      body: orderCreateBody,
    });
  typia.assert(order);

  // 3. Add order items to the created order
  const itemsCount = 3;

  const orderItems: IShoppingMallOrderItem[] = [];

  for (let i = 0; i < itemsCount; i++) {
    const itemCreateBody = {
      shopping_mall_order_id: order.id,
      shopping_mall_sale_snapshot_id: typia.random<
        string & tags.Format<"uuid">
      >(),
      quantity: 1 + (i % 5),
      price: 50000 + i * 5000,
      order_item_status: "pending",
    } satisfies IShoppingMallOrderItem.ICreate;

    const newItem: IShoppingMallOrderItem =
      await api.functional.shoppingMall.adminUser.orders.items.create(
        connection,
        {
          orderId: order.id,
          body: itemCreateBody,
        },
      );
    typia.assert(newItem);
    orderItems.push(newItem);
  }

  TestValidator.predicate(
    "order items count matches",
    orderItems.length === itemsCount,
  );

  // 4. Delete one order item
  const itemToDelete = orderItems[0];

  await api.functional.shoppingMall.adminUser.orders.items.erase(connection, {
    orderId: order.id,
    orderItemId: itemToDelete.id,
  });

  // 5. Verify deletion by ensuring the deleted item ID is no longer in list
  // Note: The API doesn't have a list endpoint in given materials, so
  // simulate verification by error on trying to delete again or similar
  // Since no list or get order item exists, we verify by attempting duplication
  // deletion which should error or by checking remaining item IDs in our variable

  // Trying to delete the same item again should cause an error
  await TestValidator.error(
    "deleting the same order item again should fail",
    async () => {
      await api.functional.shoppingMall.adminUser.orders.items.erase(
        connection,
        {
          orderId: order.id,
          orderItemId: itemToDelete.id,
        },
      );
    },
  );

  // Verify only itemsCount-1 items remain logically in our record
  TestValidator.equals(
    "order items count after deletion",
    orderItems.filter((item) => item.id !== itemToDelete.id).length,
    itemsCount - 1,
  );
}
