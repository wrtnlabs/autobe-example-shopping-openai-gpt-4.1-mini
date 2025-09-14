import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallDynamicPricing } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallDynamicPricing";

/**
 * This test validates successful creation of a dynamic pricing record by an
 * authenticated admin user.
 *
 * It begins by creating and logging in an admin user. Then, it performs the
 * dynamic pricing creation with full required fields, including valid UUIDs
 * for product and rule IDs, numerical price, algorithm version, status
 * string, and ISO 8601 effective dates. It asserts the created record
 * fields and timestamps.
 *
 * Additionally, it tests unauthorized creation attempts by unauthenticated
 * users, expecting authentication failures.
 *
 * Each step uses typia.assert for thorough type validation and
 * TestValidator for validation assertions.
 *
 * The test strictly adheres to schema defined in
 * IShoppingMallDynamicPricing and IShoppingMallAdminUser.
 *
 * @param connection API connection with auth management
 */
export async function test_api_dynamicpricing_creation_success_and_unauthorized(
  connection: api.IConnection,
) {
  // 1. Prepare admin user create data
  const adminEmail = typia.random<string & tags.Format<"email">>();
  const adminPasswordHash = RandomGenerator.alphaNumeric(32); // Simulating hash
  const adminCreateBody = {
    email: adminEmail,
    password_hash: adminPasswordHash,
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  // 2. Admin user join and login
  const adminAuthorized: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminCreateBody,
    });
  typia.assert(adminAuthorized);

  const adminLoginBody = {
    email: adminEmail,
    password_hash: adminPasswordHash,
  } satisfies IShoppingMallAdminUser.ILogin;

  const adminLoggedIn: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.login(connection, {
      body: adminLoginBody,
    });
  typia.assert(adminLoggedIn);

  // 3. Build dynamic pricing create payload with realistic UUIDs and data
  const dynamicPricingCreateBody = {
    product_id: typia.random<string & tags.Format<"uuid">>(),
    pricing_rule_id: typia.random<string & tags.Format<"uuid">>(),
    adjusted_price: Math.round(Math.random() * 10000),
    algorithm_version: RandomGenerator.paragraph({
      sentences: 2,
      wordMin: 3,
      wordMax: 6,
    }),
    status: "active",
    effective_from: new Date().toISOString(),
    effective_to: null,
  } satisfies IShoppingMallDynamicPricing.ICreate;

  // 4. Successfully create dynamic pricing record
  const createdDynamicPricing: IShoppingMallDynamicPricing =
    await api.functional.shoppingMall.adminUser.dynamicPricings.create(
      connection,
      {
        body: dynamicPricingCreateBody,
      },
    );
  typia.assert(createdDynamicPricing);

  // 5. Assert returned fields including required fields and timestamps
  TestValidator.equals(
    "dynamic pricing product_id matches input",
    createdDynamicPricing.product_id,
    dynamicPricingCreateBody.product_id,
  );
  TestValidator.equals(
    "dynamic pricing pricing_rule_id matches input",
    createdDynamicPricing.pricing_rule_id,
    dynamicPricingCreateBody.pricing_rule_id,
  );
  TestValidator.equals(
    "dynamic pricing adjusted_price matches input",
    createdDynamicPricing.adjusted_price,
    dynamicPricingCreateBody.adjusted_price,
  );
  TestValidator.equals(
    "dynamic pricing algorithm_version matches input",
    createdDynamicPricing.algorithm_version,
    dynamicPricingCreateBody.algorithm_version,
  );
  TestValidator.equals(
    "dynamic pricing status matches input",
    createdDynamicPricing.status,
    dynamicPricingCreateBody.status,
  );
  TestValidator.equals(
    "dynamic pricing effective_from matches input",
    createdDynamicPricing.effective_from,
    dynamicPricingCreateBody.effective_from,
  );
  TestValidator.equals(
    "dynamic pricing effective_to matches input",
    createdDynamicPricing.effective_to,
    dynamicPricingCreateBody.effective_to,
  );

  // 6. Ensure id and timestamps exist and conform
  TestValidator.predicate(
    "dynamic pricing id is UUID",
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      createdDynamicPricing.id,
    ),
  );
  TestValidator.predicate(
    "dynamic pricing created_at is ISO 8601",
    /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}.*Z$/.test(
      createdDynamicPricing.created_at,
    ),
  );
  TestValidator.predicate(
    "dynamic pricing updated_at is ISO 8601",
    /^[0-9]{4}-[0-9]{2}-[0-9]{2}T[0-9]{2}:[0-9]{2}:[0-9]{2}.*Z$/.test(
      createdDynamicPricing.updated_at,
    ),
  );

  // 7. Attempt unauthorized creation (simulate by using fresh connection without login)
  //    This connection deliberately has no Authorization header to simulate unauthorized user
  const freshConnection: api.IConnection = { ...connection, headers: {} };

  await TestValidator.error(
    "unauthorized user cannot create dynamic pricing",
    async () => {
      await api.functional.shoppingMall.adminUser.dynamicPricings.create(
        freshConnection,
        {
          body: dynamicPricingCreateBody,
        },
      );
    },
  );
}
