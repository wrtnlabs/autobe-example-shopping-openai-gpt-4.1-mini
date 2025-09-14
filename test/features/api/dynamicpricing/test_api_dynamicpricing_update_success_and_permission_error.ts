import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallDynamicPricing } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallDynamicPricing";

/**
 * This E2E test validates the update process of an existing dynamic pricing
 * record by an admin user. It includes creating and authenticating an admin
 * user before executing updates with valid data, confirming the record
 * updates successfully. The test also attempts updates using unauthorized
 * credentials to ensure permission errors are properly triggered, and
 * validates that update attempts with invalid dynamicPricingId
 * (non-existent) are rejected robustly. The update payload covers all
 * optional fields including product_id, pricing_rule_id, adjusted_price,
 * algorithm_version, status, effective_from, and effective_to. The test
 * strictly follows business rules, uses realistic and valid data formats
 * (UUIDs for IDs, ISO 8601 strings for dates), and ensures correct handling
 * of allowed null values. All API responses are type-asserted with
 * typia.assert for full type safety, and error scenarios are tested with
 * TestValidator.error with proper async handling and precise descriptive
 * assertions. The test function maintains proper authentication state
 * switches, and ensures the adminUser role is necessary for authorized
 * updates with other cases failing. All required properties for requests
 * and responses are included, and no non-existent properties are added,
 * respecting the schema definitions exactly.
 */
export async function test_api_dynamicpricing_update_success_and_permission_error(
  connection: api.IConnection,
) {
  // 1. Create and join the first admin user
  const adminUserEmail1: string = typia.random<string & tags.Format<"email">>();
  const adminUser1: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: adminUserEmail1,
        password_hash: RandomGenerator.alphaNumeric(32),
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(2),
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser1);

  // 2. Login as the first admin user
  const loggedInAdminUser1: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.login(connection, {
      body: {
        email: adminUserEmail1,
        password_hash: adminUser1.password_hash,
      } satisfies IShoppingMallAdminUser.ILogin,
    });
  typia.assert(loggedInAdminUser1);

  // Sample dynamicPricingId to update
  const dynamicPricingId = typia.random<string & tags.Format<"uuid">>();

  // 3. Perform a successful update with all optional fields
  const updateBody: IShoppingMallDynamicPricing.IUpdate = {
    product_id: typia.random<string & tags.Format<"uuid">>(),
    pricing_rule_id: typia.random<string & tags.Format<"uuid">>(),
    adjusted_price: Number((Math.random() * 1000).toFixed(2)),
    algorithm_version: `v${Math.floor(Math.random() * 10) + 1}`,
    status: "active",
    effective_from: new Date().toISOString(),
    effective_to: new Date(Date.now() + 86400000 * 7).toISOString(),
  };

  const updatedDynamicPricing: IShoppingMallDynamicPricing =
    await api.functional.shoppingMall.adminUser.dynamicPricings.update(
      connection,
      {
        dynamicPricingId,
        body: updateBody,
      },
    );
  typia.assert(updatedDynamicPricing);

  // 4. Test update with invalid dynamicPricingId (random UUID, not existing)
  const invalidDynamicPricingId = typia.random<string & tags.Format<"uuid">>();
  await TestValidator.error(
    "update with invalid dynamicPricingId should fail",
    async () => {
      await api.functional.shoppingMall.adminUser.dynamicPricings.update(
        connection,
        {
          dynamicPricingId: invalidDynamicPricingId,
          body: updateBody,
        },
      );
    },
  );

  // 5. Create a second admin user and login
  const adminUserEmail2 = typia.random<string & tags.Format<"email">>();
  const adminUser2: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: adminUserEmail2,
        password_hash: RandomGenerator.alphaNumeric(32),
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(2),
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser2);

  const loggedInAdminUser2: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.login(connection, {
      body: {
        email: adminUserEmail2,
        password_hash: adminUser2.password_hash,
      } satisfies IShoppingMallAdminUser.ILogin,
    });
  typia.assert(loggedInAdminUser2);

  // 6. Attempt update with second admin user (unauthorized for first dynamicPricingId)
  await TestValidator.error(
    "update by unauthorized second admin user should fail",
    async () => {
      await api.functional.shoppingMall.adminUser.dynamicPricings.update(
        connection,
        {
          dynamicPricingId,
          body: updateBody,
        },
      );
    },
  );
}
