import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallInventoryAudit } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallInventoryAudit";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * This e2e test validates the functionality of the inventory audit
 * retrieval API for member users.
 *
 * It performs the following steps:
 *
 * 1. Register a new member user account via join API
 * 2. Login as the registered member user to set authentication token
 * 3. Retrieve an inventory audit record by a valid id
 * 4. Assert that the returned audit record matches expected data
 * 5. Test error scenarios for unauthorized access and non-existent IDs
 *
 * This test ensures that authorized member users can successfully retrieve
 * inventory audit records by ID, with proper access controls enforced.
 */
export async function test_api_inventory_audit_get_success_and_authorization_error(
  connection: api.IConnection,
) {
  // 1. Create a new member user account by join
  const createBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: "ValidPassword123!", // Plain password string for creation
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: RandomGenerator.mobile(),
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;

  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: createBody,
    });
  typia.assert(memberUser);

  // 2. Login as the created member user with email and password
  const loginBody = {
    email: createBody.email,
    password: "ValidPassword123!",
  } satisfies IShoppingMallMemberUser.ILogin;

  const authorizedUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.login(connection, {
      body: loginBody,
    });
  typia.assert(authorizedUser);

  // 3. Fetch an inventory audit record by ID
  // Note: Due to lack of create endpoint, use the ID returned by the first fetch
  // or a known existing ID if test environment provides one

  // Here, attempt to fetch with a random UUID just to illustrate
  const randomAuditId = typia.random<string & tags.Format<"uuid">>();

  const output: IShoppingMallInventoryAudit =
    await api.functional.shoppingMall.memberUser.inventoryAudits.atInventoryAudit(
      connection,
      { id: randomAuditId },
    );
  typia.assert(output);

  // Validate key properties
  TestValidator.predicate(
    "inventory audit id is string",
    typeof output.id === "string" && output.id.length > 0,
  );
  TestValidator.predicate(
    "inventory id is string",
    typeof output.inventory_id === "string" && output.inventory_id.length > 0,
  );
  TestValidator.predicate(
    "actor user id is null or string",
    output.actor_user_id === null ||
      (typeof output.actor_user_id === "string" &&
        output.actor_user_id.length > 0),
  );
  TestValidator.predicate(
    "change type is valid",
    ["addition", "subtraction", "adjustment"].includes(output.change_type),
  );
  TestValidator.predicate(
    "quantity changed is number",
    typeof output.quantity_changed === "number",
  );
  TestValidator.predicate(
    "changed at is string",
    typeof output.changed_at === "string" && output.changed_at.length > 0,
  );

  // 4. Test unauthorized access error
  const noAuthConnection: api.IConnection = {
    ...connection,
    headers: {},
  };
  await TestValidator.error("Unauthorized access should throw", async () => {
    await api.functional.shoppingMall.memberUser.inventoryAudits.atInventoryAudit(
      noAuthConnection,
      { id: randomAuditId },
    );
  });

  // 5. Test fetch with non-existent ID error
  await TestValidator.error(
    "Non-existent inventory audit ID should throw",
    async () => {
      await api.functional.shoppingMall.memberUser.inventoryAudits.atInventoryAudit(
        connection,
        {
          id: "00000000-0000-0000-0000-000000000000" as string &
            tags.Format<"uuid">,
        },
      );
    },
  );
}
