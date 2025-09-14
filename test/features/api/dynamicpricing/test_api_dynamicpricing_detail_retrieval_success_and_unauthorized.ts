import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallDynamicPricing } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallDynamicPricing";

/**
 * Validate retrieval of dynamic pricing detail by ID under authorized and
 * unauthorized scenarios.
 *
 * This test covers the business workflow where an admin user creates an
 * account, logs in to obtain authentication tokens, and uses those tokens
 * to successfully retrieve detailed information of a dynamic pricing record
 * by its unique ID. It asserts the correct structure of the returned
 * pricing data with all defined properties.
 *
 * Then it tests that an unauthorized client (one without valid login
 * tokens) fails to retrieve the pricing detail, expecting an error to be
 * thrown.
 *
 * It also tests querying a non-existent dynamic pricing ID and expects a
 * not found error or similar.
 *
 * Steps:
 *
 * 1. Create admin user via /auth/adminUser/join with valid data.
 * 2. Login admin user via /auth/adminUser/login using the credentials.
 * 3. Retrieve dynamic pricing detail by an existing valid dynamicPricingId and
 *    assert all properties.
 * 4. Attempt to retrieve the same detail unauthenticated - expect error.
 * 5. Attempt to retrieve detail by a non-existent dynamicPricingId - expect
 *    error.
 */
export async function test_api_dynamicpricing_detail_retrieval_success_and_unauthorized(
  connection: api.IConnection,
) {
  // 1. Create admin user and authenticate
  const email: string = typia.random<string & tags.Format<"email">>();
  const password_hash = RandomGenerator.alphaNumeric(64); // realistic hash length for tests
  const nickname = RandomGenerator.name(2);
  const full_name = RandomGenerator.name(3);
  const status = "active";
  const createAdminBody = {
    email,
    password_hash,
    nickname,
    full_name,
    status,
  } satisfies IShoppingMallAdminUser.ICreate;

  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: createAdminBody,
    });
  typia.assert(adminUser);

  // 2. Login the admin user
  const loginBody = {
    email: createAdminBody.email,
    password_hash: createAdminBody.password_hash,
  } satisfies IShoppingMallAdminUser.ILogin;

  const loginResult: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.login(connection, {
      body: loginBody,
    });
  typia.assert(loginResult);

  // 3. Retrieve dynamic pricing detail successfully
  // Generate a valid UUID to test; ideally this would be an existing ID but we proceed with random for test
  const validDynamicPricingId: string & tags.Format<"uuid"> = typia.random<
    string & tags.Format<"uuid">
  >();

  const dynamicPricing: IShoppingMallDynamicPricing =
    await api.functional.shoppingMall.adminUser.dynamicPricings.at(connection, {
      dynamicPricingId: validDynamicPricingId,
    });
  typia.assert(dynamicPricing);

  TestValidator.predicate(
    "dynamicPricing has id",
    typeof dynamicPricing.id === "string" && dynamicPricing.id.length > 0,
  );
  TestValidator.predicate(
    "dynamicPricing has product_id",
    typeof dynamicPricing.product_id === "string" &&
      dynamicPricing.product_id.length > 0,
  );
  TestValidator.predicate(
    "dynamicPricing has pricing_rule_id",
    typeof dynamicPricing.pricing_rule_id === "string" &&
      dynamicPricing.pricing_rule_id.length > 0,
  );
  TestValidator.predicate(
    "dynamicPricing adjusted_price is number",
    typeof dynamicPricing.adjusted_price === "number",
  );
  TestValidator.predicate(
    "dynamicPricing algorithm_version is string",
    typeof dynamicPricing.algorithm_version === "string" &&
      dynamicPricing.algorithm_version.length > 0,
  );
  TestValidator.predicate(
    "dynamicPricing status is string",
    typeof dynamicPricing.status === "string" &&
      dynamicPricing.status.length > 0,
  );
  TestValidator.predicate(
    "dynamicPricing effective_from is string",
    typeof dynamicPricing.effective_from === "string" &&
      dynamicPricing.effective_from.length > 0,
  );
  TestValidator.predicate(
    "dynamicPricing created_at is string",
    typeof dynamicPricing.created_at === "string" &&
      dynamicPricing.created_at.length > 0,
  );
  TestValidator.predicate(
    "dynamicPricing updated_at is string",
    typeof dynamicPricing.updated_at === "string" &&
      dynamicPricing.updated_at.length > 0,
  );

  // 4. Attempt unauthorized access
  // Prepare unauthenticated connection
  const unauthConn: api.IConnection = { ...connection, headers: {} };

  await TestValidator.error(
    "unauthorized access to dynamic pricing detail throws",
    async () => {
      await api.functional.shoppingMall.adminUser.dynamicPricings.at(
        unauthConn,
        { dynamicPricingId: validDynamicPricingId },
      );
    },
  );

  // 5. Attempt retrieval of non-existent dynamicPricingId
  const nonExistentId: string & tags.Format<"uuid"> = typia.random<
    string & tags.Format<"uuid">
  >();

  await TestValidator.error(
    "retrieval of non-existent dynamicPricingId throws",
    async () => {
      await api.functional.shoppingMall.adminUser.dynamicPricings.at(
        connection,
        {
          dynamicPricingId: nonExistentId,
        },
      );
    },
  );
}
