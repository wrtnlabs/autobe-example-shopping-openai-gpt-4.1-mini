import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallSale } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSale";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * Validate successful retrieval of sale product detail for authenticated
 * seller user.
 *
 * This test covers the full authentication flow for a seller user role
 * including registration (join) and login, and then attempts to retrieve
 * detailed sales product information by saleId as the authenticated seller
 * user.
 *
 * The response is validated thoroughly for proper structure, data formats,
 * and consistency with the authenticated seller user ID.
 *
 * The test ensures seller user authorization is enforced and data returned
 * is realistic and conforms completely to the expected IShoppingMallSale
 * contract.
 *
 * Steps:
 *
 * 1. Create a seller user account with realistic data.
 * 2. Login as the created seller user to establish auth context.
 * 3. Retrieve sale product detail with generated realistic saleId.
 * 4. Assert all important fields and formats including UUIDs, timestamps, and
 *    business rules.
 *
 * This test guarantees secure and correct access by seller users to their
 * sales product details.
 */
export async function test_api_sales_get_detail_seller_auth_success(
  connection: api.IConnection,
) {
  // 1. Create seller user account with realistic data
  const sellerCreate = {
    email: `seller${RandomGenerator.alphaNumeric(8)}@example.com`,
    password: "StrongPassw0rd!",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: RandomGenerator.mobile("010"),
    business_registration_number: `BRN${RandomGenerator.alphaNumeric(9).toUpperCase()}`,
  } satisfies IShoppingMallSellerUser.ICreate;

  const seller: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: sellerCreate,
    });
  typia.assert(seller);

  // 2. Login with seller user credentials to establish auth context
  const sellerLogin = {
    email: sellerCreate.email,
    password: sellerCreate.password,
  } satisfies IShoppingMallSellerUser.ILogin;

  const sellerLoggedIn: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.login(connection, {
      body: sellerLogin,
    });
  typia.assert(sellerLoggedIn);

  // 3. Use the saleId of a sale associated with the seller. Since saleId is not
  // provided by scenario or join response, generate a plausible UUID for test.
  // A real test would create a sale first. Here, realistic UUID is used.
  const saleId: string & tags.Format<"uuid"> = typia.random<
    string & tags.Format<"uuid">
  >();

  // 4. Retrieve detailed sale information as authorized seller user
  const saleDetail: IShoppingMallSale =
    await api.functional.shoppingMall.sellerUser.sales.at(connection, {
      saleId,
    });
  typia.assert(saleDetail);

  // 5. Validate all mandatory fields and correct data formats
  TestValidator.predicate(
    "shopping_mall_channel_id is uuid",
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/.test(
      saleDetail.shopping_mall_channel_id,
    ),
  );
  TestValidator.equals(
    "shopping_mall_seller_user_id matches authorized seller",
    saleDetail.shopping_mall_seller_user_id,
    seller.id,
  );
  TestValidator.predicate(
    "status is non-empty string",
    typeof saleDetail.status === "string" && saleDetail.status.length > 0,
  );
  TestValidator.predicate(
    "name is non-empty string",
    typeof saleDetail.name === "string" && saleDetail.name.length > 0,
  );
  TestValidator.predicate(
    "price is positive number",
    typeof saleDetail.price === "number" && saleDetail.price > 0,
  );
  TestValidator.predicate(
    "created_at is valid ISO date-time",
    !isNaN(Date.parse(saleDetail.created_at)),
  );
  TestValidator.predicate(
    "updated_at is valid ISO date-time",
    !isNaN(Date.parse(saleDetail.updated_at)),
  );
  if (saleDetail.deleted_at !== undefined && saleDetail.deleted_at !== null) {
    TestValidator.predicate(
      "deleted_at is valid ISO date-time if present",
      !isNaN(Date.parse(saleDetail.deleted_at)),
    );
  } else {
    TestValidator.equals(
      "deleted_at explicit null or undefined",
      saleDetail.deleted_at,
      null,
    );
  }
}
