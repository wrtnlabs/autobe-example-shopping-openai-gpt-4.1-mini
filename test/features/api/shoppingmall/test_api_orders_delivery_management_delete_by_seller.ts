import { ArrayUtil, RandomGenerator, TestValidator } from "@nestia/e2e";
import { IConnection } from "@nestia/fetcher";
import typia, { tags } from "typia";

import api from "@ORGANIZATION/PROJECT-api";
import type { IAuthorizationToken } from "@ORGANIZATION/PROJECT-api/lib/structures/IAuthorizationToken";
import type { IShoppingMallAdminUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallAdminUser";
import type { IShoppingMallChannel } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallChannel";
import type { IShoppingMallDelivery } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallDelivery";
import type { IShoppingMallMemberUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallMemberUser";
import type { IShoppingMallOrder } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallOrder";
import type { IShoppingMallSale } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSale";
import type { IShoppingMallSection } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSection";
import type { IShoppingMallSellerUser } from "@ORGANIZATION/PROJECT-api/lib/structures/IShoppingMallSellerUser";

/**
 * This test verifies the seller user's ability to hard delete a delivery record
 * associated with an order they own. It involves a multi-role setup including
 * seller user, member user, and admin user. First, the test creates seller,
 * member, and admin users to establish authentication contexts. Then, it
 * creates a sales channel and section using the admin role, followed by the
 * creation of a sales product by the seller user. Next, an order is placed by
 * the seller user (on behalf of the member user) using the created sales
 * channel and section. Afterward, a delivery record for the order is created by
 * the seller user. Finally, the test deletes the delivery record by the seller
 * user, confirming successful deletion without errors. The test asserts type
 * correctness using typia.assert and verifies correct workflow steps including
 * authentication role switching before operations.
 */
export async function test_api_orders_delivery_management_delete_by_seller(
  connection: api.IConnection,
) {
  // 1. Create seller user and authenticate
  const sellerUserEmail = typia.random<string & tags.Format<"email">>();
  const sellerUser: IShoppingMallSellerUser.IAuthorized =
    await api.functional.auth.sellerUser.join(connection, {
      body: {
        email: sellerUserEmail,
        password: "SellerPass123$",
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        phone_number: RandomGenerator.mobile(),
        business_registration_number: `BRN${RandomGenerator.alphaNumeric(9)}`,
      } satisfies IShoppingMallSellerUser.ICreate,
    });
  typia.assert(sellerUser);

  // 2. Create member user and authenticate
  const memberUserEmail = typia.random<string & tags.Format<"email">>();
  const memberUser: IShoppingMallMemberUser.IAuthorized =
    await api.functional.auth.memberUser.join(connection, {
      body: {
        email: memberUserEmail,
        password_hash: "MemberPass123$",
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        phone_number: RandomGenerator.mobile(),
        status: "active",
      } satisfies IShoppingMallMemberUser.ICreate,
    });
  typia.assert(memberUser);

  // 3. Create admin user and authenticate
  const adminUserEmail = typia.random<string & tags.Format<"email">>();
  const adminUser: IShoppingMallAdminUser.IAuthorized =
    await api.functional.auth.adminUser.join(connection, {
      body: {
        email: adminUserEmail,
        password_hash: "AdminPass123$",
        nickname: RandomGenerator.name(),
        full_name: RandomGenerator.name(),
        status: "active",
      } satisfies IShoppingMallAdminUser.ICreate,
    });
  typia.assert(adminUser);

  // 4. Switch to admin user for channel and section creation
  await api.functional.auth.adminUser.login(connection, {
    body: {
      email: adminUserEmail,
      password_hash: "AdminPass123$",
    } satisfies IShoppingMallAdminUser.ILogin,
  });

  // 5. Create sales channel
  const channelCode = `channel_${RandomGenerator.alphaNumeric(6)}`;
  const channelName = `Channel ${RandomGenerator.name(1)}`;
  const channel: IShoppingMallChannel =
    await api.functional.shoppingMall.adminUser.channels.create(connection, {
      body: {
        code: channelCode,
        name: channelName,
        description: RandomGenerator.paragraph({ sentences: 6 }),
        status: "active",
      } satisfies IShoppingMallChannel.ICreate,
    });
  typia.assert(channel);

  // 6. Create product section
  const sectionCode = `section_${RandomGenerator.alphaNumeric(6)}`;
  const sectionName = `Section ${RandomGenerator.name(1)}`;
  const section: IShoppingMallSection =
    await api.functional.shoppingMall.adminUser.sections.create(connection, {
      body: {
        code: sectionCode,
        name: sectionName,
        description: RandomGenerator.paragraph({ sentences: 6 }),
        status: "active",
      } satisfies IShoppingMallSection.ICreate,
    });
  typia.assert(section);

  // 7. Switch back to seller user for sales creation
  await api.functional.auth.sellerUser.login(connection, {
    body: {
      email: sellerUserEmail,
      password: "SellerPass123$",
    } satisfies IShoppingMallSellerUser.ILogin,
  });

  // 8. Create sales product
  const saleCode = `sale_${RandomGenerator.alphaNumeric(6)}`;
  const sale: IShoppingMallSale =
    await api.functional.shoppingMall.sellerUser.sales.create(connection, {
      body: {
        shopping_mall_channel_id: channel.id,
        shopping_mall_section_id: section.id,
        shopping_mall_seller_user_id: sellerUser.id,
        code: saleCode,
        status: "active",
        name: `Product ${RandomGenerator.name(1)}`,
        description: RandomGenerator.content({ paragraphs: 1 }),
        price: 10000,
      } satisfies IShoppingMallSale.ICreate,
    });
  typia.assert(sale);

  // 9. Create order placed by seller user on behalf of member user
  const orderCode = `ORDER-${RandomGenerator.alphaNumeric(8)}`;
  const order: IShoppingMallOrder =
    await api.functional.shoppingMall.sellerUser.orders.createOrder(
      connection,
      {
        body: {
          shopping_mall_memberuser_id: memberUser.id,
          shopping_mall_channel_id: channel.id,
          shopping_mall_section_id: section.id,
          order_code: orderCode,
          order_status: "pending",
          payment_status: "pending",
          total_price: 10000,
        } satisfies IShoppingMallOrder.ICreate,
      },
    );
  typia.assert(order);

  // 10. Create delivery record for the order
  const deliveryStatus = "preparing";
  const deliveryStage = "preparation";
  const expectedDeliveryDate = new Date(
    Date.now() + 7 * 24 * 60 * 60 * 1000,
  ).toISOString();
  const deliveryCreateBody = {
    shopping_mall_order_id: order.id,
    delivery_status: deliveryStatus,
    delivery_stage: deliveryStage,
    expected_delivery_date: expectedDeliveryDate,
    start_time: null,
    end_time: null,
  } satisfies IShoppingMallDelivery.ICreate;

  const delivery: IShoppingMallDelivery =
    await api.functional.shoppingMall.sellerUser.orders.deliveries.create(
      connection,
      {
        orderId: order.id,
        body: deliveryCreateBody,
      },
    );
  typia.assert(delivery);

  // 11. Delete delivery record by seller user
  await api.functional.shoppingMall.sellerUser.orders.deliveries.erase(
    connection,
    {
      orderId: order.id,
      deliveryId: delivery.id,
    },
  );

  // If no errors occur, the deletion succeeded
}
