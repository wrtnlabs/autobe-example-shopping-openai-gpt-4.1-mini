import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";
import type { IShoppingMallOrder } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrder";

/**
 * This E2E test validates the successful update of an existing order by a
 * member user with appropriate authorization and valid order update data. The
 * test scenario is as follows:
 *
 * 1. A new member user is created by invoking the join API to establish the member
 *    user authentication context. This step satisfies the authentication
 *    prerequisite for the member user role.
 * 2. The test generates a realistic order update payload including channel ID,
 *    section ID, order code, order status, payment status, and total price. All
 *    required and relevant optional fields are provided consistent with type
 *    and format definitions.
 * 3. The order update API is called, passing the member user authentication and
 *    the valid orderId.
 * 4. The response is validated to ensure the order record is successfully updated
 *    and returned with expected properties.
 * 5. Typia.assert is used on the response to confirm full type correctness.
 *
 * This test verifies the proper end-to-end flow of order updating under member
 * user authorization context, ensuring both the API contract and business logic
 * are correctly implemented and enforced.
 */
export async function test_api_member_user_order_update_success(
  connection: api.IConnection,
) {
  // Step 1: Create member user and obtain authentication
  const userCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(16),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: RandomGenerator.mobile(),
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;

  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: userCreateBody,
    });
  typia.assert(memberUser);

  // Step 2: Prepare order update data
  const orderUpdateBody = {
    shopping_mall_channel_id: typia.random<string & tags.Format<"uuid">>(),
    shopping_mall_section_id: typia.random<string & tags.Format<"uuid">>(),
    order_code: `ORD-${RandomGenerator.alphaNumeric(8)}`,
    order_status: "confirmed",
    payment_status: "paid",
    total_price: Math.floor(Math.random() * 100000) + 1000, // realistic positive number
  } satisfies IShoppingMallOrder.IUpdate;

  // Step 3: Call update order API
  const updatedOrder: IShoppingMallOrder =
    await api.functional.shoppingMall.memberUser.orders.updateOrder(
      connection,
      {
        orderId: typia.random<string & tags.Format<"uuid">>(),
        body: orderUpdateBody,
      },
    );

  // Step 4: Validate result
  typia.assert(updatedOrder);
}
