import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallGuestUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallGuestUser";
import type { IShoppingMallPayment } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallPayment";

/**
 * Test updating a payment application for an order as a guest user.
 *
 * Covers successful update scenarios including verifying updated fields,
 * error scenarios where order or payment IDs do not exist, and unauthorized
 * update attempt without guest authentication.
 *
 * Workflow:
 *
 * 1. Create guest user and authenticate.
 * 2. Perform valid payment update and verify the response.
 * 3. Attempt update with invalid IDs and expect error.
 * 4. Attempt update without authentication and expect error.
 */
export async function test_api_order_update_payment_guest_user_success_and_error_cases(
  connection: api.IConnection,
) {
  // 1. Guest user join and authentication
  const guestJoinBody = {
    ip_address: "192.168.0.1",
    access_url: "https://test.shoppingmall.com",
    referrer: null,
    user_agent: null,
  } satisfies IShoppingMallGuestUser.IJoin;

  const guestUser: IShoppingMallGuestUser.IAuthorized =
    await api.functional.auth.guestUser.join(connection, {
      body: guestJoinBody,
    });
  typia.assert(guestUser);

  // 2. Define valid orderId and paymentId using realistic UUIDs
  const orderId = typia.random<string & tags.Format<"uuid">>();
  const paymentId = typia.random<string & tags.Format<"uuid">>();

  // 3. Compose a valid payment update body
  const paymentUpdateBody = {
    payment_method: "credit_card",
    payment_status: "confirmed",
    payment_amount: 20000,
    transaction_id: "TXN-20230911-0001",
    cancelled_at: null,
  } satisfies IShoppingMallPayment.IUpdate;

  // 4. Perform successful update
  const updatedPayment: IShoppingMallPayment =
    await api.functional.shoppingMall.guestUser.orders.payments.update(
      connection,
      {
        orderId,
        paymentId,
        body: paymentUpdateBody,
      },
    );
  typia.assert(updatedPayment);

  TestValidator.equals(
    "payment_method should be updated",
    updatedPayment.payment_method,
    paymentUpdateBody.payment_method,
  );

  TestValidator.equals(
    "payment_status should be updated",
    updatedPayment.payment_status,
    paymentUpdateBody.payment_status,
  );

  TestValidator.equals(
    "payment_amount should be updated",
    updatedPayment.payment_amount,
    paymentUpdateBody.payment_amount,
  );

  TestValidator.equals(
    "transaction_id should be updated",
    updatedPayment.transaction_id,
    paymentUpdateBody.transaction_id,
  );

  TestValidator.equals(
    "cancelled_at should be updated as null",
    updatedPayment.cancelled_at,
    paymentUpdateBody.cancelled_at,
  );

  // 5. Test error scenario: invalid orderId and paymentId
  await TestValidator.error(
    "error thrown for non-existent orderId and paymentId",
    async () => {
      await api.functional.shoppingMall.guestUser.orders.payments.update(
        connection,
        {
          orderId: typia.random<string & tags.Format<"uuid">>(),
          paymentId: typia.random<string & tags.Format<"uuid">>(),
          body: paymentUpdateBody,
        },
      );
    },
  );

  // 6. Test unauthorized update (without guest authentication)
  const unauthenticatedConnection: api.IConnection = {
    ...connection,
    headers: {},
  };
  await TestValidator.error(
    "unauthorized error on update without guest authentication",
    async () => {
      await api.functional.shoppingMall.guestUser.orders.payments.update(
        unauthenticatedConnection,
        {
          orderId,
          paymentId,
          body: paymentUpdateBody,
        },
      );
    },
  );
}
