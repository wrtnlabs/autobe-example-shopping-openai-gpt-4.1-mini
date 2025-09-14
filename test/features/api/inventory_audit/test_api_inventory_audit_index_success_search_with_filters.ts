import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallInventoryAudit } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallInventoryAudit";
import type { IShoppingMallInventoryAudit } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallInventoryAudit";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * This test validates the inventory audit log search API that allows memberUser
 * users to retrieve inventory audit records with pagination and filters. It
 * covers registration of memberUser, performing search with filters, verifying
 * correct pagination and data, testing empty search results with rare UUIDs,
 * and validating unauthorized access fails.
 */
export async function test_api_inventory_audit_index_success_search_with_filters(
  connection: api.IConnection,
) {
  // Step 1: Register a new member user to obtain authentication context
  const email = typia.random<string & tags.Format<"email">>();
  const passwordPlain = "Password123!";
  const joinBody = {
    email,
    password_hash: passwordPlain,
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: RandomGenerator.mobile(),
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;

  const member: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: joinBody,
    });
  typia.assert(member);

  // Step 2: Prepare filter parameters for inventory audit search
  const inventoryIdFilter = member.id;
  const actorUserIdFilter = member.id;

  // Step 3: Perform inventory audit search with pagination and filters
  const searchRequest = {
    inventory_id: inventoryIdFilter,
    actor_user_id: actorUserIdFilter,
    page: 1,
    limit: 10,
  } satisfies IShoppingMallInventoryAudit.IRequest;

  const searchResponse: IPageIShoppingMallInventoryAudit =
    await api.functional.shoppingMall.memberUser.inventoryAudits.indexInventoryAudits(
      connection,
      {
        body: searchRequest,
      },
    );
  typia.assert(searchResponse);

  TestValidator.predicate(
    "pagination.current page is at least 1",
    searchResponse.pagination.current >= 1,
  );
  TestValidator.predicate(
    "pagination.limit is positive",
    searchResponse.pagination.limit > 0,
  );
  TestValidator.predicate(
    "pagination.records is non-negative",
    searchResponse.pagination.records >= 0,
  );
  TestValidator.predicate(
    "pagination.pages is non-negative",
    searchResponse.pagination.pages >= 0,
  );

  TestValidator.predicate(
    "data is an array",
    Array.isArray(searchResponse.data),
  );
  for (const audit of searchResponse.data) {
    typia.assert(audit);

    if (
      searchRequest.inventory_id !== undefined &&
      searchRequest.inventory_id !== null
    ) {
      TestValidator.equals(
        "audit record matches inventory_id filter",
        audit.inventory_id,
        searchRequest.inventory_id,
      );
    }
    if (
      searchRequest.actor_user_id !== undefined &&
      searchRequest.actor_user_id !== null
    ) {
      if (audit.actor_user_id !== null && audit.actor_user_id !== undefined) {
        TestValidator.equals(
          "audit record matches actor_user_id filter when actor_user_id present",
          audit.actor_user_id,
          searchRequest.actor_user_id,
        );
      }
    }
  }

  // Step 4: Test empty search result edge case by using unlikely UUIDs
  const emptySearchRequest = {
    inventory_id: typia.random<string & tags.Format<"uuid">>(),
    actor_user_id: typia.random<string & tags.Format<"uuid">>(),
    page: 1,
    limit: 5,
  } satisfies IShoppingMallInventoryAudit.IRequest;

  const emptySearchResponse: IPageIShoppingMallInventoryAudit =
    await api.functional.shoppingMall.memberUser.inventoryAudits.indexInventoryAudits(
      connection,
      {
        body: emptySearchRequest,
      },
    );
  typia.assert(emptySearchResponse);
  TestValidator.equals(
    "empty search returns zero records",
    emptySearchResponse.data.length,
    0,
  );

  // Step 5: Test unauthorized access by unauthenticated connection
  const unauthenticatedConnection: api.IConnection = {
    ...connection,
    headers: {},
  };

  await TestValidator.error(
    "unauthorized access to inventory audits fails",
    async () => {
      await api.functional.shoppingMall.memberUser.inventoryAudits.indexInventoryAudits(
        unauthenticatedConnection,
        {
          body: {
            page: 1,
            limit: 10,
          } satisfies IShoppingMallInventoryAudit.IRequest,
        },
      );
    },
  );
}
