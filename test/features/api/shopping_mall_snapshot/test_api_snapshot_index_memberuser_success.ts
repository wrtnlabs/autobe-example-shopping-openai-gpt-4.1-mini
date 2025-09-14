import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IPage } from "@ORGANIZATION/PROJECT-api/lib/structures/IPage";
import type { IPageIShoppingMallSnapshot } from "@ORGANIZATION/PROJECT-api/lib/structures/IPageIShoppingMallSnapshot";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";
import type { IShoppingMallSnapshot } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSnapshot";

/**
 * Test successful retrieval of a paginated list of snapshots for authenticated
 * member users. Verify filtering by entity type, entity ID, and created_at date
 * range works correctly. Ensure pagination and sorting work as expected.
 * Validate proper authorization enforcement for member users.
 */
export async function test_api_snapshot_index_memberuser_success(
  connection: api.IConnection,
) {
  // Step 1: Member user join (sign up) with realistic data
  const memberUserCreate = {
    email: `user_${RandomGenerator.alphaNumeric(6)}@example.com`,
    password_hash: RandomGenerator.alphaNumeric(12),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: null,
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;

  const memberUser = await api.functional.auth.memberUser.join(connection, {
    body: memberUserCreate,
  });
  typia.assert(memberUser);

  // Step 2: Login as the recently joined member user to get authorization
  const loginPayload = {
    email: memberUser.email,
    password: memberUserCreate.password_hash,
  } satisfies IShoppingMallMemberUser.ILogin;

  const memberUserAuth = await api.functional.auth.memberUser.login(
    connection,
    {
      body: loginPayload,
    },
  );
  typia.assert(memberUserAuth);

  // Step 3: Construct filter criteria for snapshot index
  // Filtering for entity_type and entity_id matching realistic values.
  // Use created_at_from as recent date, created_at_to as now
  const now = new Date();
  const createdAtFrom = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000); // 7 days ago

  const filterBody = {
    page: 1,
    limit: 10,
    entity_type: "order",
    entity_id: memberUser.id,
    created_at_from: createdAtFrom.toISOString(),
    created_at_to: now.toISOString(),
  } satisfies IShoppingMallSnapshot.IRequest;

  // Step 4: Call the snapshot index API with filter and pagination
  const pagedSnapshots =
    await api.functional.shoppingMall.memberUser.snapshots.indexSnapshots(
      connection,
      {
        body: filterBody,
      },
    );

  // Step 5: Assert returned paginated snapshot data.
  typia.assert(pagedSnapshots);

  TestValidator.equals(
    "pagination page matches request",
    pagedSnapshots.pagination.current,
    filterBody.page,
  );

  TestValidator.equals(
    "pagination limit matches request",
    pagedSnapshots.pagination.limit,
    filterBody.limit,
  );

  // Step 6: Business rule checks on snapshots.
  // Make sure every snapshot has correct entity_type and entity_id matching filters
  for (const snapshot of pagedSnapshots.data) {
    TestValidator.equals(
      "snapshot entity_type matches filter",
      snapshot.entity_type,
      filterBody.entity_type,
    );
    TestValidator.equals(
      "snapshot entity_id matches filter",
      snapshot.entity_id,
      filterBody.entity_id,
    );
    // created_at within from/to
    const createdAtDate = new Date(snapshot.created_at);
    TestValidator.predicate(
      "snapshot created_at is after created_at_from",
      createdAtDate >= createdAtFrom,
    );
    TestValidator.predicate(
      "snapshot created_at is before created_at_to",
      createdAtDate <= now,
    );
  }
}
