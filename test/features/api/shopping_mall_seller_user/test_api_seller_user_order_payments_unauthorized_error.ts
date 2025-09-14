import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallPayment } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallPayment";
import type { IShoppingMallPayment } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallPayment";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * Test unauthorized access scenario where a seller user tries to retrieve order
 * payments without authentication. The server should return unauthorized error
 * for this attempt.
 */
export async function test_api_seller_user_order_payments_unauthorized_error(
  connection: api.IConnection,
) {
  // 1. Seller user join to create account and authenticate
  const userCreate = {
    email: typia.random<string & tags.Format<"email">>(),
    password: "P@ssword123!",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: RandomGenerator.mobile("010"),
    business_registration_number: RandomGenerator.alphaNumeric(20),
  } satisfies IShoppingMallSellerUser.ICreate;

  const authorizedUser = await api.functional.auth.sellerUser.join(connection, {
    body: userCreate,
  });
  typia.assert(authorizedUser);

  // 2. Prepare an unauthenticated connection by clearing headers
  const unauthenticatedConnection: api.IConnection = {
    ...connection,
    headers: {},
  };

  // 3. Invoke order payments index API with unauthenticated connection
  const orderId = typia.random<string & tags.Format<"uuid">>();
  await TestValidator.error(
    "unauthorized access to order payments should fail",
    async () => {
      await api.functional.shoppingMall.sellerUser.orders.payments.index(
        unauthenticatedConnection,
        {
          orderId,
          body: {} satisfies IShoppingMallPayment.IRequest,
        },
      );
    },
  );
}
