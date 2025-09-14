import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallSellerResponse } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallSellerResponse";
import type { IShoppingMallSellerResponse } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerResponse";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * This scenario tests the unauthorized access attempt to the seller
 * responses list by an unauthenticated user. The request should fail due to
 * missing authentication, verifying the access control security of the
 * endpoint.
 *
 * Steps:
 *
 * 1. Perform the join operation for seller user to ensure authentication
 *    context (dependency).
 * 2. Attempt to call PATCH /shoppingMall/sellerUser/sellerResponses without
 *    setting valid authentication (simulate unauthenticated user).
 * 3. Verify that an error is thrown due to lack of authentication.
 */
export async function test_api_sellerresponse_unauthorized_access(
  connection: api.IConnection,
) {
  // 1. Setup: Seller user join (dependency step)
  const sellerUserCreateBody: IShoppingMallSellerUser.ICreate = {
    email: RandomGenerator.alphaNumeric(6) + "@example.com",
    password: "Password123!",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: RandomGenerator.mobile(),
    business_registration_number:
      RandomGenerator.alphaNumeric(10).toUpperCase(),
  };
  await api.functional.auth.sellerUser.join(connection, {
    body: sellerUserCreateBody,
  });

  // 2. Attempt access without authentication
  // Create a connection clone with empty headers to simulate unauthenticated access
  const unauthConn: api.IConnection = { ...connection, headers: {} };

  // Prepare a request body satisfying IShoppingMallSellerResponse.IRequest schema
  const requestBody = {
    page: 1,
    limit: 10,
    search: null,
    is_private: null,
    status: null,
  } satisfies IShoppingMallSellerResponse.IRequest;

  // 3. Verify that an error is thrown due to authentication failure
  await TestValidator.error(
    "unauthenticated access to seller responses should fail",
    async () => {
      await api.functional.shoppingMall.sellerUser.sellerResponses.index(
        unauthConn,
        {
          body: requestBody,
        },
      );
    },
  );
}
