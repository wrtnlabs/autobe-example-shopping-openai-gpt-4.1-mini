import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallPayment } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallPayment";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";
import type { IShoppingMallPayment } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallPayment";

/**
 * This test validates the error handling mechanism of the payment applications
 * retrieval API when accessed without proper authentication as a member user.
 * The test workflow first establishes a valid member user context by
 * registering a new member user account via the provided join endpoint. It then
 * attempts to query the list of payment applications for a specific order
 * without authenticating (i.e., using a connection that lacks the required
 * authorization headers). The expected behavior is that the system rejects the
 * request with an unauthorized error (implicit by failure to authenticate). The
 * order ID used for querying payments is randomly generated in valid UUID
 * format. This scenario ensures that the security layer effectively prevents
 * unauthorized data access to payment applications in the shopping mall backend
 * system.
 *
 * Important details:
 *
 * - Member user joins via POST /auth/memberUser/join to create a valid user
 *   account and obtain authorization token.
 * - The main test calls PATCH /shoppingMall/memberUser/orders/{orderId}/payments
 *   with valid orderId but unauthenticated connection.
 * - Expected outcome: API call fails due to lack of authentication, throwing an
 *   error.
 * - Order ID is random UUID.
 * - The test avoids unauthorized header manipulations and relies on empty headers
 *   for unauthenticated calls.
 * - Uses the exact DTOs and API SDK functions provided.
 * - Employs typia.assert to validate response structure for join operation only.
 * - Ensures all required properties are included according to DTO definitions.
 *
 * This comprehensive scenario confirms that the payment applications retrieval
 * endpoint is protected against unauthorized access attempts by member users.
 */
export async function test_api_member_user_order_payments_unauthorized_error(
  connection: api.IConnection,
) {
  // 1. Mandatory step: Join operation to create a member user account with valid credentials
  const createBody = {
    email: RandomGenerator.alphaNumeric(10) + "@example.com",
    password_hash: RandomGenerator.alphaNumeric(24),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: null,
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;

  const joinedMember: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, { body: createBody });
  typia.assert(joinedMember);

  // 2. Prepare an unauthenticated connection (empty headers) for unauthorized request
  const unauthenticatedConnection: api.IConnection = {
    ...connection,
    headers: {},
  };

  // 3. Attempt to query payment applications list without authentication
  await TestValidator.error(
    "payment applications list retrieval without authentication should fail",
    async () => {
      await api.functional.shoppingMall.memberUser.orders.payments.index(
        unauthenticatedConnection,
        {
          orderId: typia.random<string & tags.Format<"uuid">>(),
          body: {}, // empty request body - all properties are optional
        },
      );
    },
  );
}
