import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallCategory } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallCategory";
import type { IShoppingMallChannel } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallChannel";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";
import type { IShoppingMallOrder } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrder";
import type { IShoppingMallSale } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSale";
import type { IShoppingMallSection } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSection";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

export async function test_api_order_get_seller_success(
  connection: api.IConnection,
) {
  // 1. Create admin user and authenticate
  const adminCreateBody = {
    email: `admin_${RandomGenerator.alphaNumeric(8)}@example.com`,
    password_hash: "SecureP@ssw0rd!",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    status: "active",
  } satisfies IShoppingMallAdminUser.ICreate;
  const admin: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: adminCreateBody,
    });
  typia.assert(admin);

  // 2. Admin login (to confirm token management)
  await api.functional.auth.adminUser.login(connection, {
    body: {
      email: adminCreateBody.email,
      password_hash: adminCreateBody.password_hash,
    } satisfies IShoppingMallAdminUser.ILogin,
  });

  // 3. Create sales channel as admin
  const channelCreateBody = {
    code: `channel_${RandomGenerator.alphaNumeric(5)}`,
    name: RandomGenerator.name(),
    description: "Test sales channel",
    status: "active",
  } satisfies IShoppingMallChannel.ICreate;

  const channel: IShoppingMallChannel =
    await api.functional.shoppingMall.adminUser.channels.create(connection, {
      body: channelCreateBody,
    });
  typia.assert(channel);

  // 4. Create product category as admin
  const categoryCreateBody = {
    code: `cat_${RandomGenerator.alphaNumeric(5)}`,
    name: RandomGenerator.name(),
    description: "Test product category",
    status: "active",
  } satisfies IShoppingMallCategory.ICreate;

  const category: IShoppingMallCategory =
    await api.functional.shoppingMall.adminUser.categories.create(connection, {
      body: categoryCreateBody,
    });
  typia.assert(category);

  // 5. Create spatial section as admin
  const sectionCreateBody = {
    code: `section_${RandomGenerator.alphaNumeric(5)}`,
    name: RandomGenerator.name(),
    description: "Test spatial section",
    status: "active",
  } satisfies IShoppingMallSection.ICreate;

  const section: IShoppingMallSection =
    await api.functional.shoppingMall.adminUser.sections.create(connection, {
      body: sectionCreateBody,
    });
  typia.assert(section);

  // 6. Create seller user and login
  const sellerCreateBody = {
    email: `seller_${RandomGenerator.alphaNumeric(8)}@example.com`,
    password: "SecureSellerP@ss1",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    phone_number: RandomGenerator.mobile(),
    business_registration_number: `BRN${RandomGenerator.alphaNumeric(5)}`,
  } satisfies IShoppingMallSellerUser.ICreate;

  const seller: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: sellerCreateBody,
    });
  typia.assert(seller);

  await api.functional.auth.sellerUser.login(connection, {
    body: {
      email: sellerCreateBody.email,
      password: sellerCreateBody.password,
    } satisfies IShoppingMallSellerUser.ILogin,
  });

  // 7. Create a sale product with seller user
  const saleCreateBody = {
    shopping_mall_channel_id: channel.id,
    shopping_mall_section_id: section.id,
    shopping_mall_seller_user_id: seller.id,
    code: `sale_${RandomGenerator.alphaNumeric(8)}`,
    status: "active",
    name: `Product ${RandomGenerator.alphaNumeric(3)}`,
    description: "Test product description",
    price: 5000,
  } satisfies IShoppingMallSale.ICreate;

  const sale: IShoppingMallSale =
    await api.functional.shoppingMall.sellerUser.sales.create(connection, {
      body: saleCreateBody,
    });
  typia.assert(sale);

  // 8. Create member user and login
  const memberCreateBody = {
    email: `member_${RandomGenerator.alphaNumeric(8)}@example.com`,
    password_hash: "SecureMemberP@ss2",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    phone_number: RandomGenerator.mobile(),
    status: "active",
  } satisfies IShoppingMallMemberUser.ICreate;

  const member: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: memberCreateBody,
    });
  typia.assert(member);

  await api.functional.auth.memberUser.login(connection, {
    body: {
      email: memberCreateBody.email,
      password: "SecureMemberP@ss2",
    } satisfies IShoppingMallMemberUser.ILogin,
  });

  // 9. Member user creates order
  const orderCreateBody = {
    shopping_mall_memberuser_id: member.id,
    shopping_mall_channel_id: channel.id,
    shopping_mall_section_id: section.id,
    order_code: `ORDER${RandomGenerator.alphaNumeric(6)}`,
    order_status: "pending",
    payment_status: "pending",
    total_price: sale.price,
  } satisfies IShoppingMallOrder.ICreate;

  const order: IShoppingMallOrder =
    await api.functional.shoppingMall.memberUser.orders.createOrder(
      connection,
      {
        body: orderCreateBody,
      },
    );
  typia.assert(order);

  // 10. Seller user retrieves the order detail
  const readOrder: IShoppingMallOrder =
    await api.functional.shoppingMall.sellerUser.orders.atOrder(connection, {
      orderId: order.id,
    });
  typia.assert(readOrder);

  TestValidator.equals("seller can retrieve order", readOrder.id, order.id);
  TestValidator.equals(
    "order belongs to same member user",
    readOrder.shopping_mall_memberuser_id,
    member.id,
  );
  TestValidator.equals(
    "order belongs to same sales channel",
    readOrder.shopping_mall_channel_id,
    channel.id,
  );

  // 11. Failure case: another seller user (not owner) tries to access order
  const otherSellerCreateBody = {
    email: `seller_other_${RandomGenerator.alphaNumeric(8)}@example.com`,
    password: "AnotherSecureP@ss3",
    nickname: RandomGenerator.name(),
    full_name: RandomGenerator.name(),
    phone_number: RandomGenerator.mobile(),
    business_registration_number: `BRN${RandomGenerator.alphaNumeric(5)}`,
  } satisfies IShoppingMallSellerUser.ICreate;

  const otherSeller: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: otherSellerCreateBody,
    });
  typia.assert(otherSeller);

  await api.functional.auth.sellerUser.login(connection, {
    body: {
      email: otherSellerCreateBody.email,
      password: otherSellerCreateBody.password,
    } satisfies IShoppingMallSellerUser.ILogin,
  });

  await TestValidator.error("other seller cannot access order", async () => {
    await api.functional.shoppingMall.sellerUser.orders.atOrder(connection, {
      orderId: order.id,
    });
  });
}
