import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallSection } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSection";

export async function test_api_section_update_success(
  connection: api.IConnection,
) {
  // 1. Admin user joins to get authorized context for admin operations.
  const adminCreateBody = {
    email: typia.random<string & tags.Format<"email">>(),
    password_hash: RandomGenerator.alphaNumeric(16),
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;

  const adminAuthorization: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminCreateBody,
    });
  typia.assert(adminAuthorization);

  // 2. Create spatial section to update
  const sectionCreateBody = {
    code: `section-${RandomGenerator.alphabets(5)}`,
    name: RandomGenerator.name(),
    description: RandomGenerator.paragraph({ sentences: 3 }) + ".",
    status: "active",
  } satisfies IShoppingMallSection.ICreate;
  const createdSection: IShoppingMallSection =
    await api.functional.shoppingMall.adminUser.sections.create(connection, {
      body: sectionCreateBody,
    });
  typia.assert(createdSection);

  // 3. Update spatial section with new values
  const updateBody = {
    code: `updated-${RandomGenerator.alphabets(5)}`,
    name: RandomGenerator.name(),
    description: RandomGenerator.paragraph({ sentences: 5 }),
    status: "inactive",
  } satisfies IShoppingMallSection.IUpdate;

  const updatedSection: IShoppingMallSection =
    await api.functional.shoppingMall.adminUser.sections.updateSection(
      connection,
      {
        id: createdSection.id,
        body: updateBody,
      },
    );
  typia.assert(updatedSection);

  // 4. Validate the updated section fields
  TestValidator.equals(
    "Updated section code should match",
    updatedSection.code,
    updateBody.code,
  );
  TestValidator.equals(
    "Updated section name should match",
    updatedSection.name,
    updateBody.name,
  );
  TestValidator.equals(
    "Updated section description should match",
    updatedSection.description ?? null,
    updateBody.description ?? null,
  );
  TestValidator.equals(
    "Updated section status should match",
    updatedSection.status,
    updateBody.status,
  );
}
