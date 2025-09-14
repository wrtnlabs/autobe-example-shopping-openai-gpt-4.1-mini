import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallSection } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSection";

/**
 * Test retrieving detailed information of a shopping mall spatial section
 * by its unique ID.
 *
 * The test covers successful retrieval with authorized admin user
 * authentication, validating the presence and correctness of all section
 * properties as defined in the IShoppingMallSection DTO, including UUID
 * formatted id, code, name, optional description, status, creation and
 * update timestamps, and soft deletion timestamp if any.
 *
 * The test also validates failure cases including retrieving a non-existent
 * section, and trying to retrieve section data while unauthorized.
 *
 * All API calls are awaited and response data validation is done using
 * typia.assert. Errors are expected and validated using awaited
 * TestValidator.error with descriptive messages.
 */
export async function test_api_section_retrieve_success_and_authorization_failure(
  connection: api.IConnection,
) {
  // 1. Admin user joins to obtain authentication token
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: RandomGenerator.alphaNumeric(8) + "@test.com",
        password_hash: RandomGenerator.alphaNumeric(16),
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(2),
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // 2. Attempt to retrieve a section with a random valid UUID
  const validSectionId: string & tags.Format<"uuid"> = typia.random<
    string & tags.Format<"uuid">
  >();
  const section: IShoppingMallSection =
    await api.functional.shoppingMall.adminUser.sections.at(connection, {
      id: validSectionId,
    });
  typia.assert(section);

  // 3. Attempt to retrieve a non-existent section with a different random UUID
  const nonExistentSectionId: string & tags.Format<"uuid"> = typia.random<
    string & tags.Format<"uuid">
  >();
  await TestValidator.error(
    "retrieving non-existent section should throw",
    async () => {
      await api.functional.shoppingMall.adminUser.sections.at(connection, {
        id: nonExistentSectionId,
      });
    },
  );

  // 4. Attempt to retrieve section without authorization (empty headers)
  const unauthConn: api.IConnection = { ...connection, headers: {} };
  await TestValidator.error(
    "retrieving section without authorization should throw",
    async () => {
      await api.functional.shoppingMall.adminUser.sections.at(unauthConn, {
        id: validSectionId,
      });
    },
  );
}
