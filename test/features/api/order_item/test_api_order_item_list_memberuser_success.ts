import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallOrderItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallOrderItem";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";
import type { IShoppingMallOrder } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrder";
import type { IShoppingMallOrderItem } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrderItem";

/**
 * Test retrieving paginated list of order items for a member user's specific
 * order.
 *
 * The test workflow:
 *
 * 1. Create two member users (for authorization check).
 * 2. Authenticate as the first member user.
 * 3. Create an order for the first member user.
 * 4. Add multiple valid order items to the order.
 * 5. Retrieve the paginated list of order items for the order and verify:
 *
 *    - Pagination information correctness.
 *    - Presence and type correctness of order items.
 * 6. Switch authentication to the second member user.
 * 7. Attempt to retrieve the first member user's order items with the second
 *    user's token; expect failure and validate error.
 *
 * All API interactions are accompanied by typia.assert for response validation.
 * TestValidator is used for business constraints and error assertions with
 * descriptive titles.
 */
export async function test_api_order_item_list_memberuser_success(
  connection: api.IConnection,
) {
  // 1. Create first member user
  const firstMemberUserBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(10),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: null,
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;

  const firstUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: firstMemberUserBody,
    });
  typia.assert(firstUser);

  // 2. Create an order by first member user
  const orderBody = {
    shopping_mall_memberuser_id: firstUser.id,
    shopping_mall_channel_id: typia.random<string & tags.Format<"uuid">>(),
    shopping_mall_section_id: null,
    order_code: RandomGenerator.alphaNumeric(6),
    order_status: "pending",
    payment_status: "pending",
    total_price: 10000,
  } satisfies IShoppingMallOrder.ICreate;

  const order: IShoppingMallOrder =
    await api.functional.shoppingMall.memberUser.orders.createOrder(
      connection,
      { body: orderBody },
    );
  typia.assert(order);

  // 3. Add multiple valid order items
  // For the sale snapshot ID, generate valid UUID strings
  const orderItemsBodies = ArrayUtil.repeat(3, () => {
    return {
      shopping_mall_order_id: order.id,
      shopping_mall_sale_snapshot_id: typia.random<
        string & tags.Format<"uuid">
      >(),
      quantity: RandomGenerator.pick([1, 2, 3, 4]),
      price: 3333,
      order_item_status: "pending",
    } satisfies IShoppingMallOrderItem.ICreate;
  });

  const orderItems: IShoppingMallOrderItem[] = [];
  for (const body of orderItemsBodies) {
    const item =
      await api.functional.shoppingMall.memberUser.orders.items.create(
        connection,
        { orderId: order.id, body },
      );
    typia.assert(item);
    orderItems.push(item);
  }

  // 4. Retrieve paginated list of order items for the order
  const page: IPageIShoppingMallOrderItem =
    await api.functional.shoppingMall.memberUser.orders.items.indexOrderItems(
      connection,
      { orderId: order.id },
    );
  typia.assert(page);

  // Validate pagination info
  TestValidator.equals(
    "pagination current page is 1",
    page.pagination.current,
    1,
  );
  TestValidator.predicate(
    "pagination limit is greater than zero",
    page.pagination.limit > 0,
  );
  TestValidator.equals(
    "pagination records count matches array length",
    page.pagination.records,
    page.data.length,
  );
  const calculatedPages = Math.ceil(
    page.pagination.records / page.pagination.limit,
  );
  TestValidator.equals(
    "pagination pages count correct",
    page.pagination.pages,
    calculatedPages,
  );

  // Validate that order items page data has items fetched
  TestValidator.predicate("order items page has items", page.data.length > 0);

  // Validate that each order item belongs to the order and has valid data
  for (const item of page.data) {
    TestValidator.equals(
      "order item belongs to order",
      item.shopping_mall_order_id,
      order.id,
    );
    TestValidator.predicate("order item quantity positive", item.quantity > 0);
    TestValidator.predicate("order item price positive", item.price > 0);
    TestValidator.predicate(
      "order item status valid",
      ["pending", "shipped", "returned", "cancelled"].includes(
        item.order_item_status,
      ),
    );
  }

  // 5. Create second member user (for authorization failure test)
  const secondMemberUserBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(10),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: null,
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;

  const secondUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: secondMemberUserBody,
    });
  typia.assert(secondUser);

  // 6. Attempt unauthorized access to first user's order items as second user
  await TestValidator.error(
    "unauthorized member user cannot access other user's order items",
    async () => {
      await api.functional.shoppingMall.memberUser.orders.items.indexOrderItems(
        connection,
        { orderId: order.id },
      );
    },
  );
}
