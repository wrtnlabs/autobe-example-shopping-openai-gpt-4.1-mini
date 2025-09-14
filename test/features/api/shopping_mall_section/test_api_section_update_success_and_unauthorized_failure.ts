import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallSection } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSection";

/**
 * Test updating an existing shopping mall spatial section's details by its
 * unique ID with valid admin authentication.
 *
 * This test covers successful update operation validating that modified
 * fields (code, name, description, status) are reflected correctly along
 * with asserting the presence of created_at and updated_at timestamps.
 *
 * It also tests negative cases including update with non-existent section
 * ID and update attempt without authentication, ensuring proper error
 * handling and authorization enforcement.
 *
 * Workflow:
 *
 * 1. Create admin user via /auth/adminUser/join and authenticate connection.
 * 2. Build a valid update request with randomized fields.
 * 3. Call updateSection API with valid UUID and check for success and matching
 *    updated fields.
 * 4. Attempt update with non-existent UUID to verify failure.
 * 5. Attempt update with unauthenticated connection to verify failure.
 */
export async function test_api_section_update_success_and_unauthorized_failure(
  connection: api.IConnection,
) {
  // 1. Admin user join and authenticate, SDK sets Authorization token in connection headers
  const adminCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(32),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const admin: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminCreateBody,
    });
  typia.assert(admin);

  // 2. Prepare update payload with valid randomized values
  const updatePayload = {
    code: RandomGenerator.alphaNumeric(10),
    name: RandomGenerator.name(3),
    description: RandomGenerator.paragraph({
      sentences: 5,
      wordMin: 3,
      wordMax: 7,
    }),
    status: "active",
  } satisfies IShoppingMallSection.IUpdate;

  // 3. Generate a valid UUID for existing section id; true existence not verifiable due to no create API
  const existingSectionId: string & tags.Format<"uuid"> = typia.random<
    string & tags.Format<"uuid">
  >();

  // 4. Call updateSection with valid id and payload, expect success
  const updatedSection: IShoppingMallSection =
    await api.functional.shoppingMall.adminUser.sections.updateSection(
      connection,
      {
        id: existingSectionId,
        body: updatePayload,
      },
    );
  typia.assert(updatedSection);

  // 5. Validate that updated fields match the payload
  TestValidator.equals("updated code", updatedSection.code, updatePayload.code);
  TestValidator.equals("updated name", updatedSection.name, updatePayload.name);
  TestValidator.equals(
    "updated description",
    updatedSection.description ?? null,
    updatePayload.description ?? null,
  );
  TestValidator.equals(
    "updated status",
    updatedSection.status,
    updatePayload.status,
  );

  // 6. Validate timestamps exist and are non-empty strings (basic ISO 8601 format validation could be enhanced)
  TestValidator.predicate(
    "created_at is non-empty string",
    typeof updatedSection.created_at === "string" &&
      updatedSection.created_at.length > 0,
  );
  TestValidator.predicate(
    "updated_at is non-empty string",
    typeof updatedSection.updated_at === "string" &&
      updatedSection.updated_at.length > 0,
  );

  // 7. Test failure when updating non-existent section id
  const nonExistentId: string & tags.Format<"uuid"> = typia.random<
    string & tags.Format<"uuid">
  >();
  if (nonExistentId !== existingSectionId) {
    await TestValidator.error(
      "update with non-existent ID should fail",
      async () => {
        await api.functional.shoppingMall.adminUser.sections.updateSection(
          connection,
          {
            id: nonExistentId,
            body: updatePayload,
          },
        );
      },
    );
  }

  // 8. Test failure when updating without authentication
  const unauthenticatedConnection: api.IConnection = {
    ...connection,
    headers: {},
  };
  await TestValidator.error(
    "update without authentication should fail",
    async () => {
      await api.functional.shoppingMall.adminUser.sections.updateSection(
        unauthenticatedConnection,
        {
          id: existingSectionId,
          body: updatePayload,
        },
      );
    },
  );
}
