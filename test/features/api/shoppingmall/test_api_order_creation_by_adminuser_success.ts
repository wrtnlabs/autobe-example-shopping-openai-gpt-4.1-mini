import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallOrder } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrder";

/**
 * This test validates the successful creation of an order by an authenticated
 * admin user. The test workflow includes:
 *
 * 1. Creating a new admin user to establish authentication context.
 * 2. Using the authenticated context to post a new order with all required fields.
 * 3. Validating that the order is created with consistent and expected data.
 * 4. Ensuring authorization and token handling works as expected.
 *
 * It tests the key business flow where an admin user manages order creation,
 * verifying the backend correctly processes and records order details.
 */
export async function test_api_order_creation_by_adminuser_success(
  connection: api.IConnection,
) {
  // 1. Create new admin user (join)
  const adminUserEmail: string = typia.random<string & tags.Format<"email">>();
  const adminUserPasswordHash = RandomGenerator.alphaNumeric(64);
  const adminUserNickname = RandomGenerator.name();
  const adminUserFullName = RandomGenerator.name(2);
  const adminUserStatus = "active";

  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: adminUserEmail,
        password_hash: adminUserPasswordHash,
        nickname: adminUserNickname,
        full_name: adminUserFullName,
        status: adminUserStatus,
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // 2. Prepare order creation payload
  // Random uuids for member user and channel, section passed as null to test optional
  const memberUserId: string = typia.random<string & tags.Format<"uuid">>();
  const channelId: string = typia.random<string & tags.Format<"uuid">>();
  const sectionId: (string & tags.Format<"uuid">) | null = null; // explicit null
  const uniqueOrderCode = RandomGenerator.alphaNumeric(10);
  const orderStatus = "pending"; // Example order status matching domain logic
  const paymentStatus = "pending"; // Example payment status
  const totalPrice = Math.round(1000 + Math.random() * 9000); // realistic positive total price

  const createOrderBody = {
    shopping_mall_memberuser_id: memberUserId,
    shopping_mall_channel_id: channelId,
    shopping_mall_section_id: sectionId,
    order_code: uniqueOrderCode,
    order_status: orderStatus,
    payment_status: paymentStatus,
    total_price: totalPrice,
  } satisfies IShoppingMallOrder.ICreate;

  // 3. Create the order
  const createdOrder: IShoppingMallOrder =
    await api.functional.shoppingMall.adminUser.orders.createOrder(connection, {
      body: createOrderBody,
    });
  typia.assert(createdOrder);

  // 4. Validate response consistency
  TestValidator.equals(
    "order shopping_mall_memberuser_id matches input",
    createdOrder.shopping_mall_memberuser_id,
    memberUserId,
  );
  TestValidator.equals(
    "order shopping_mall_channel_id matches input",
    createdOrder.shopping_mall_channel_id,
    channelId,
  );
  TestValidator.equals(
    "order shopping_mall_section_id matches input",
    createdOrder.shopping_mall_section_id,
    sectionId,
  );
  TestValidator.equals(
    "order_code matches input",
    createdOrder.order_code,
    uniqueOrderCode,
  );
  TestValidator.equals(
    "order_status matches input",
    createdOrder.order_status,
    orderStatus,
  );
  TestValidator.equals(
    "payment_status matches input",
    createdOrder.payment_status,
    paymentStatus,
  );
  TestValidator.equals(
    "total_price matches input",
    createdOrder.total_price,
    totalPrice,
  );

  // 5. Validate immutable fields exist and have correct formats
  typia.assert<string & tags.Format<"uuid">>(createdOrder.id);
  typia.assert<string & tags.Format<"date-time">>(createdOrder.created_at);
  typia.assert<string & tags.Format<"date-time">>(createdOrder.updated_at);
  if (
    createdOrder.deleted_at !== null &&
    createdOrder.deleted_at !== undefined
  ) {
    typia.assert<string & tags.Format<"date-time">>(createdOrder.deleted_at);
  }
}
