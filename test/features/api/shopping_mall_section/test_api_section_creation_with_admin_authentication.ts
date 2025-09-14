import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallSection } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSection";

/**
 * Test creating a new shopping mall spatial section with valid data as an
 * authenticated admin user.
 *
 * This test covers the entire process of
 *
 * - Admin user creation and authentication,
 * - Spatial section creation with valid and realistic data,
 * - Validation of the returned spatial section record,
 * - Validation of access denial when unauthenticated.
 */
export async function test_api_section_creation_with_admin_authentication(
  connection: api.IConnection,
) {
  // 1. Create admin user for authentication context
  const adminUserCreate: IShoppingMallAdminUser.ICreate = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(32),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    status: "active",
  };

  const adminAuthorized: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminUserCreate,
    });
  typia.assert(adminAuthorized);

  // 2. Create spatial section as admin
  const sectionCreateRequest = {
    code: RandomGenerator.alphaNumeric(10),
    name: RandomGenerator.paragraph({ sentences: 3 }),
    description: RandomGenerator.content({ paragraphs: 2 }),
    status: "active",
  } satisfies IShoppingMallSection.ICreate;

  const createdSection: IShoppingMallSection =
    await api.functional.shoppingMall.adminUser.sections.create(connection, {
      body: sectionCreateRequest,
    });
  typia.assert(createdSection);

  // 3. Validate returned data
  TestValidator.predicate(
    "createdSection.id is uuid",
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      createdSection.id,
    ),
  );
  TestValidator.equals(
    "createdSection.code matches",
    createdSection.code,
    sectionCreateRequest.code,
  );
  TestValidator.equals(
    "createdSection.name matches",
    createdSection.name,
    sectionCreateRequest.name,
  );
  TestValidator.equals(
    "createdSection.status matches",
    createdSection.status,
    sectionCreateRequest.status,
  );
  TestValidator.predicate(
    "createdSection.created_at is ISO string",
    !isNaN(Date.parse(createdSection.created_at)),
  );
  TestValidator.predicate(
    "createdSection.updated_at is ISO string",
    !isNaN(Date.parse(createdSection.updated_at)),
  );
  TestValidator.predicate(
    "createdSection.deleted_at is null or undefined",
    createdSection.deleted_at === null ||
      createdSection.deleted_at === undefined,
  );

  // 4. Test unauthorized creation (no admin token)
  const unauthConnection: api.IConnection = { ...connection, headers: {} };
  await TestValidator.error("unauthorized create should fail", async () => {
    await api.functional.shoppingMall.adminUser.sections.create(
      unauthConnection,
      {
        body: sectionCreateRequest,
      },
    );
  });
}
