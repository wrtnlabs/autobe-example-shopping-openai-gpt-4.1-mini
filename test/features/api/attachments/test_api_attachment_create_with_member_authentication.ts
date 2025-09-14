import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAttachments } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAttachments";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";

/**
 * Validate attachment creation by an authenticated member user.
 *
 * This test ensures the entire flow from member user registration to login,
 * followed by attachment metadata creation with required fields validated.
 * Upload IP is optionally included and timestamps are verified via typia.
 * All API responses are type-checked.
 *
 * Steps:
 *
 * 1. Member user joins the system
 * 2. Member user logs in to establish authentication
 * 3. Authenticated member user creates an attachment metadata record
 * 4. The created attachment is validated for all required properties and
 *    correctness
 *
 * This test skips type error or missing field negative scenarios as those
 * are prevented by TypeScript type safety.
 */
export async function test_api_attachment_create_with_member_authentication(
  connection: api.IConnection,
) {
  // 1. Member user joins
  const email = typia.random<string & tags.Format<"email">>();
  const passwordPlain = RandomGenerator.alphaNumeric(12);
  const createBody = {
    email,
    password_hash: passwordPlain,
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(2),
    phone_number: undefined,
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;
  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: createBody,
    });
  typia.assert(memberUser);

  // 2. Member user login
  const loginBody = {
    email,
    password: passwordPlain,
  } satisfies IShoppingMallMemberUser.ILogin;
  const loginUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.login(connection, {
      body: loginBody,
    });
  typia.assert(loginUser);

  // 3. Create attachment metadata as authenticated member user
  const attachmentsCreateBody = {
    file_name:
      RandomGenerator.alphaNumeric(5) +
      "." +
      RandomGenerator.pick(["png", "jpg", "jpeg", "gif"] as const),
    file_url: "https://cdn.example.com/" + RandomGenerator.alphaNumeric(20),
    media_type: RandomGenerator.pick([
      "image/png",
      "image/jpeg",
      "image/gif",
      "application/pdf",
      "application/zip",
    ] as const),
    file_size: typia.random<number & tags.Type<"int32"> & tags.Minimum<1>>(),
    upload_ip: RandomGenerator.pick([undefined, null, "203.0.113.45"]),
  } satisfies IShoppingMallAttachments.ICreate;
  const attachment: IShoppingMallAttachments =
    await api.functional.shoppingMall.memberUser.attachments.create(
      connection,
      {
        body: attachmentsCreateBody,
      },
    );
  typia.assert(attachment);

  // Validate response fields
  typia.assert<string & tags.Format<"uuid">>(attachment.id);

  TestValidator.equals(
    "file_name matches",
    attachment.file_name,
    attachmentsCreateBody.file_name,
  );
  TestValidator.equals(
    "file_url matches",
    attachment.file_url,
    attachmentsCreateBody.file_url,
  );
  TestValidator.equals(
    "media_type matches",
    attachment.media_type,
    attachmentsCreateBody.media_type,
  );
  TestValidator.equals(
    "file_size matches",
    attachment.file_size,
    attachmentsCreateBody.file_size,
  );
  if (attachmentsCreateBody.upload_ip === null) {
    TestValidator.equals("upload_ip is null", attachment.upload_ip, null);
  } else if (attachmentsCreateBody.upload_ip === undefined) {
    TestValidator.predicate(
      "upload_ip is undefined or null",
      attachment.upload_ip === undefined || attachment.upload_ip === null,
    );
  } else {
    TestValidator.equals(
      "upload_ip matches",
      attachment.upload_ip,
      attachmentsCreateBody.upload_ip,
    );
  }
  TestValidator.predicate(
    "created_at is valid string",
    typeof attachment.created_at === "string" &&
      attachment.created_at.length > 0,
  );
  TestValidator.predicate(
    "updated_at is valid string",
    typeof attachment.updated_at === "string" &&
      attachment.updated_at.length > 0,
  );
}
