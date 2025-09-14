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
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * Test successful retrieval of paginated order items list for a seller
 * user's order.
 *
 * Workflow:
 *
 * 1. Sign up a seller user.
 * 2. Sign up a member user.
 * 3. Member user logs in.
 * 4. Member user creates a new order.
 * 5. Member user adds multiple items to the order.
 * 6. Seller user logs in.
 * 7. Seller user queries order items for the order.
 * 8. Validate the list of order items and pagination.
 * 9. Attempt unauthorized access by another seller user and expect failure.
 */
export async function test_api_order_item_list_selleruser_success(
  connection: api.IConnection,
) {
  // 1. Seller User Sign Up
  const sellerEmail = typia.random<string & tags.Format<"email">>();
  const sellerPassword = "1234";
  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: {
        email: sellerEmail,
        password: sellerPassword,
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        phone_number: RandomGenerator.mobile(),
        business_registration_number: `BRN${RandomGenerator.alphaNumeric(9)}`,
      } satisfies IShoppingMallSellerUser.ICreate,
    });
  typia.assert(sellerUser);

  // 2. Member User Sign Up
  const memberEmail = typia.random<string & tags.Format<"email">>();
  const memberPassword = "1234";
  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: {
        email: memberEmail,
        password_hash: memberPassword,
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        phone_number: RandomGenerator.mobile(),
        status: "active",
      } satisfies IShoppingMallMemberUser.ICreate,
    });
  typia.assert(memberUser);

  // 3. Member User login (to establish auth context and create order)
  await api.functional.auth.memberUser.login(connection, {
    body: {
      email: memberEmail,
      password: memberPassword,
    } satisfies IShoppingMallMemberUser.ILogin,
  });

  // 4. Member User creates an order
  const orderCreateBody = {
    shopping_mall_memberuser_id: memberUser.id,
    shopping_mall_channel_id: typia.random<string & tags.Format<"uuid">>(),
    shopping_mall_section_id: null,
    order_code: `ORD${RandomGenerator.alphaNumeric(12)}`,
    order_status: "pending",
    payment_status: "pending",
    total_price: 10000,
  } satisfies IShoppingMallOrder.ICreate;
  const order: IShoppingMallOrder =
    await api.functional.shoppingMall.memberUser.orders.createOrder(
      connection,
      {
        body: orderCreateBody,
      },
    );
  typia.assert(order);

  // 5. Member user adds multiple items to the order
  // Create 3 order items with valid sale snapshot ids and quantities
  const orderItems: IShoppingMallOrderItem[] = [];
  for (let i = 0; i < 3; i++) {
    const itemCreateBody: IShoppingMallOrderItem.ICreate = {
      shopping_mall_order_id: order.id,
      shopping_mall_sale_snapshot_id: typia.random<
        string & tags.Format<"uuid">
      >(),
      quantity: 1 + i,
      price: 1000 * (i + 1),
      order_item_status: "pending",
    };
    const orderItem: IShoppingMallOrderItem =
      await api.functional.shoppingMall.memberUser.orders.items.create(
        connection,
        {
          orderId: order.id,
          body: itemCreateBody,
        },
      );
    typia.assert(orderItem);
    orderItems.push(orderItem);
  }

  // 6. Seller User login to switch auth context
  await api.functional.auth.sellerUser.login(connection, {
    body: {
      email: sellerEmail,
      password: sellerPassword,
    } satisfies IShoppingMallSellerUser.ILogin,
  });

  // 7. Seller user queries order items for the order
  const pageItems: IPageIShoppingMallOrderItem =
    await api.functional.shoppingMall.sellerUser.orders.items.indexOrderItems(
      connection,
      { orderId: order.id },
    );
  typia.assert(pageItems);

  // Validate the pagination and data
  TestValidator.predicate(
    "pagination current page is 0 or greater",
    pageItems.pagination.current >= 0,
  );
  TestValidator.predicate(
    "pagination limit is positive",
    pageItems.pagination.limit > 0,
  );
  TestValidator.predicate(
    "pagination records is positive",
    pageItems.pagination.records >= orderItems.length,
  );
  TestValidator.predicate(
    "pagination pages is positive",
    pageItems.pagination.pages >= 1,
  );

  // Validate that number of data items returned is not greater than limit
  TestValidator.predicate(
    "returned data count within limit",
    pageItems.data.length <= pageItems.pagination.limit,
  );

  // Confirm all returned data belong to the correct order
  for (const item of pageItems.data) {
    TestValidator.equals(
      "order ID matches",
      item.shopping_mall_order_id,
      order.id,
    );
    TestValidator.predicate(
      "items must have valid uuids",
      typeof item.id === "string" && item.id.length > 0,
    );
  }

  // 8. Unauthorized seller user sign up and login
  const unauthorizedSellerEmail = typia.random<string & tags.Format<"email">>();
  const unauthorizedSellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: {
        email: unauthorizedSellerEmail,
        password: sellerPassword,
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        phone_number: RandomGenerator.mobile(),
        business_registration_number: `BRN${RandomGenerator.alphaNumeric(9)}`,
      } satisfies IShoppingMallSellerUser.ICreate,
    });
  typia.assert(unauthorizedSellerUser);
  await api.functional.auth.sellerUser.login(connection, {
    body: {
      email: unauthorizedSellerEmail,
      password: sellerPassword,
    } satisfies IShoppingMallSellerUser.ILogin,
  });

  // 9. Unauthorized seller user attempts to retrieve the same order items and should fail
  await TestValidator.error(
    "unauthorized seller user cannot access other seller's order items",
    async () => {
      await api.functional.shoppingMall.sellerUser.orders.items.indexOrderItems(
        connection,
        { orderId: order.id },
      );
    },
  );
}
