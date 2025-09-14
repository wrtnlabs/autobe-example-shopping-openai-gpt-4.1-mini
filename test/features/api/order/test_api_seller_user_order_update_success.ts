import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallOrder } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrder";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * This E2E test validates the complete successful update workflow of an
 * existing order by a seller user in the shopping mall system.
 *
 * The test begins by creating and authenticating a seller user via the join
 * operation, establishing the proper authentication context.
 *
 * Subsequently, it prepares a valid order update request payload including
 * all required fields such as member user ID, sales channel ID, section ID
 * (nullable), order code, order status, payment status, and total price,
 * adhering strictly to the API DTO requirements.
 *
 * It then issues an update request to the order identified by orderId,
 * verifying that the operation returns a fully valid updated order.
 *
 * The test validates that all returned fields match the update input values
 * exactly and asserts that the updated_at timestamp is the same or newer
 * than created_at, confirming the update was applied properly.
 *
 * This end-to-end test ensures the updateOrder API endpoint functions
 * correctly under authenticated conditions with precise, realistic data.
 */
export async function test_api_seller_user_order_update_success(
  connection: api.IConnection,
) {
  // 1. Seller user joins and authenticates
  const createSellerUserBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password: "StrongPassword123!",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: RandomGenerator.mobile(),
    business_registration_number:
      RandomGenerator.alphaNumeric(10).toUpperCase(),
  } satisfies IShoppingMallSellerUser.ICreate;
  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: createSellerUserBody,
    });
  typia.assert(sellerUser);

  // 2. Prepare order update data
  const orderUpdateBody = {
    shopping_mall_memberuser_id: typia.random<string & tags.Format<"uuid">>(),
    shopping_mall_channel_id: typia.random<string & tags.Format<"uuid">>(),
    shopping_mall_section_id: null,
    order_code: RandomGenerator.alphaNumeric(12).toUpperCase(),
    order_status: "confirmed",
    payment_status: "paid",
    total_price: Math.floor(
      RandomGenerator.sample([10000, 25000, 50000], 1)[0],
    ),
    deleted_at: null,
  } satisfies IShoppingMallOrder.IUpdate;

  // 3. Generate valid orderId to update
  const orderId: string & tags.Format<"uuid"> = typia.random<
    string & tags.Format<"uuid">
  >();

  // 4. Perform order update
  const updatedOrder: IShoppingMallOrder =
    await api.functional.shoppingMall.sellerUser.orders.updateOrder(
      connection,
      {
        orderId: orderId,
        body: orderUpdateBody,
      },
    );
  typia.assert(updatedOrder);

  // 5. Validate that updated order contains correct updated values
  TestValidator.equals(
    "updated order member user ID",
    updatedOrder.shopping_mall_memberuser_id,
    orderUpdateBody.shopping_mall_memberuser_id,
  );
  TestValidator.equals(
    "updated order channel ID",
    updatedOrder.shopping_mall_channel_id,
    orderUpdateBody.shopping_mall_channel_id,
  );
  TestValidator.equals(
    "updated order section ID",
    updatedOrder.shopping_mall_section_id,
    orderUpdateBody.shopping_mall_section_id,
  );
  TestValidator.equals(
    "updated order code",
    updatedOrder.order_code,
    orderUpdateBody.order_code,
  );
  TestValidator.equals(
    "updated order status",
    updatedOrder.order_status,
    orderUpdateBody.order_status,
  );
  TestValidator.equals(
    "updated payment status",
    updatedOrder.payment_status,
    orderUpdateBody.payment_status,
  );
  TestValidator.equals(
    "updated total price",
    updatedOrder.total_price,
    orderUpdateBody.total_price,
  );

  // 6. Validate timestamp logic: updated_at is after or equal created_at
  TestValidator.predicate(
    "updated_at is same or later than created_at",
    new Date(updatedOrder.updated_at).getTime() >=
      new Date(updatedOrder.created_at).getTime(),
  );
}
