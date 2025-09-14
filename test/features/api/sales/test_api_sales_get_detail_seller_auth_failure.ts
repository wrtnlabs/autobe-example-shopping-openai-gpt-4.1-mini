import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallSale } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSale";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

export async function test_api_sales_get_detail_seller_auth_failure(
  connection: api.IConnection,
) {
  // 1. Create seller user via the join endpoint
  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: {
        email: "seller@example.com",
        password: "P@ssword123!",
        nickname: "BestSeller",
        full_name: "John Doe",
        phone_number: "+1234567890",
        business_registration_number: "BRN123456789",
      } satisfies IShoppingMallSellerUser.ICreate,
    });
  typia.assert(sellerUser);

  // 2. Login as the same seller user
  const loginUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.login(connection, {
      body: {
        email: sellerUser.email,
        password: "P@ssword123!",
      } satisfies IShoppingMallSellerUser.ILogin,
    });
  typia.assert(loginUser);

  // 3. Create fake saleId for testing
  const fakeSaleId: string & tags.Format<"uuid"> = typia.random<
    string & tags.Format<"uuid">
  >();

  // 4. Create unauthorized connection with empty headers to simulate invalid token
  const unauthConn: api.IConnection = { ...connection, headers: {} };

  // 5. Expect error when accessing sales detail without authorization
  await TestValidator.error(
    "Access denied due to missing or invalid authentication",
    async () => {
      await api.functional.shoppingMall.sellerUser.sales.at(unauthConn, {
        saleId: fakeSaleId,
      });
    },
  );
}
