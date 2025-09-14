import { Module } from "@nestjs/common";

import { AuthGuestuserController } from "./controllers/auth/guestUser/AuthGuestuserController";
import { AuthMemberuserController } from "./controllers/auth/memberUser/AuthMemberuserController";
import { AuthSelleruserController } from "./controllers/auth/sellerUser/AuthSelleruserController";
import { AuthSelleruserPasswordResetRequestController } from "./controllers/auth/sellerUser/password/reset/request/AuthSelleruserPasswordResetRequestController";
import { AuthSelleruserPasswordResetConfirmController } from "./controllers/auth/sellerUser/password/reset/confirm/AuthSelleruserPasswordResetConfirmController";
import { AuthSelleruserPasswordChangeController } from "./controllers/auth/sellerUser/password/change/AuthSelleruserPasswordChangeController";
import { AuthAdminuserController } from "./controllers/auth/adminUser/AuthAdminuserController";
import { ShoppingmallAdminuserChannelsController } from "./controllers/shoppingMall/adminUser/channels/ShoppingmallAdminuserChannelsController";
import { ShoppingmallAdminuserSectionsController } from "./controllers/shoppingMall/adminUser/sections/ShoppingmallAdminuserSectionsController";
import { ShoppingmallAdminuserChannelcategoriesController } from "./controllers/shoppingMall/adminUser/channelCategories/ShoppingmallAdminuserChannelcategoriesController";
import { ShoppingmallAdminuserAttachmentsController } from "./controllers/shoppingMall/adminUser/attachments/ShoppingmallAdminuserAttachmentsController";
import { ShoppingmallAttachmentsController } from "./controllers/shoppingMall/attachments/ShoppingmallAttachmentsController";
import { ShoppingmallMemberuserAttachmentsController } from "./controllers/shoppingMall/memberUser/attachments/ShoppingmallMemberuserAttachmentsController";
import { ShoppingmallAdminuserGuestusersController } from "./controllers/shoppingMall/adminUser/guestUsers/ShoppingmallAdminuserGuestusersController";
import { ShoppingmallAdminuserMemberusersController } from "./controllers/shoppingMall/adminUser/memberUsers/ShoppingmallAdminuserMemberusersController";
import { ShoppingmallAdminuserSellerusersController } from "./controllers/shoppingMall/adminUser/sellerUsers/ShoppingmallAdminuserSellerusersController";
import { ShoppingmallAdminuserAdminusersController } from "./controllers/shoppingMall/adminUser/adminUsers/ShoppingmallAdminuserAdminusersController";
import { ShoppingmallAdminuserSalesController } from "./controllers/shoppingMall/adminUser/sales/ShoppingmallAdminuserSalesController";
import { ShoppingmallSelleruserSalesController } from "./controllers/shoppingMall/sellerUser/sales/ShoppingmallSelleruserSalesController";
import { ShoppingmallSelleruserSalesSnapshotsController } from "./controllers/shoppingMall/sellerUser/sales/snapshots/ShoppingmallSelleruserSalesSnapshotsController";
import { ShoppingmallAdminuserSalesSnapshotsController } from "./controllers/shoppingMall/adminUser/sales/snapshots/ShoppingmallAdminuserSalesSnapshotsController";
import { ShoppingmallSelleruserSalesSaleunitsController } from "./controllers/shoppingMall/sellerUser/sales/saleUnits/ShoppingmallSelleruserSalesSaleunitsController";
import { ShoppingmallAdminuserSalesSaleunitsController } from "./controllers/shoppingMall/adminUser/sales/saleUnits/ShoppingmallAdminuserSalesSaleunitsController";
import { ShoppingmallSelleruserSalesSaleunitsSaleunitoptionsController } from "./controllers/shoppingMall/sellerUser/sales/saleUnits/saleUnitOptions/ShoppingmallSelleruserSalesSaleunitsSaleunitoptionsController";
import { ShoppingmallAdminuserSalesSaleunitsSaleunitoptionsController } from "./controllers/shoppingMall/adminUser/sales/saleUnits/saleUnitOptions/ShoppingmallAdminuserSalesSaleunitsSaleunitoptionsController";
import { ShoppingmallSelleruserSaleoptionsController } from "./controllers/shoppingMall/sellerUser/saleOptions/ShoppingmallSelleruserSaleoptionsController";
import { ShoppingmallAdminuserSaleoptionsController } from "./controllers/shoppingMall/adminUser/saleOptions/ShoppingmallAdminuserSaleoptionsController";
import { ShoppingmallAdminuserSaleoptiongroupsController } from "./controllers/shoppingMall/adminUser/saleOptionGroups/ShoppingmallAdminuserSaleoptiongroupsController";
import { ShoppingmallSelleruserSaleoptiongroupsController } from "./controllers/shoppingMall/sellerUser/saleOptionGroups/ShoppingmallSelleruserSaleoptiongroupsController";
import { ShoppingmallAdminuserInventoryController } from "./controllers/shoppingMall/adminUser/inventory/ShoppingmallAdminuserInventoryController";
import { ShoppingmallSelleruserInventoryController } from "./controllers/shoppingMall/sellerUser/inventory/ShoppingmallSelleruserInventoryController";
import { ShoppingmallAdminuserCategoriesController } from "./controllers/shoppingMall/adminUser/categories/ShoppingmallAdminuserCategoriesController";
import { ShoppingmallAdminuserCategoriesCategoryrelationsParentController } from "./controllers/shoppingMall/adminUser/categories/categoryRelations/parent/ShoppingmallAdminuserCategoriesCategoryrelationsParentController";
import { ShoppingmallAdminuserCategoriesCategoryrelationsChildController } from "./controllers/shoppingMall/adminUser/categories/categoryRelations/child/ShoppingmallAdminuserCategoriesCategoryrelationsChildController";
import { ShoppingmallMemberuserCartsController } from "./controllers/shoppingMall/memberUser/carts/ShoppingmallMemberuserCartsController";
import { ShoppingmallMemberuserCartsCartitemsController } from "./controllers/shoppingMall/memberUser/carts/cartItems/ShoppingmallMemberuserCartsCartitemsController";
import { ShoppingmallAdminuserCartsCartitemsController } from "./controllers/shoppingMall/adminUser/carts/cartItems/ShoppingmallAdminuserCartsCartitemsController";
import { ShoppingmallMemberuserCartitemsCartitemoptionsController } from "./controllers/shoppingMall/memberUser/cartItems/cartItemOptions/ShoppingmallMemberuserCartitemsCartitemoptionsController";
import { ShoppingmallAdminuserCartitemsCartitemoptionsController } from "./controllers/shoppingMall/adminUser/cartItems/cartItemOptions/ShoppingmallAdminuserCartitemsCartitemoptionsController";
import { ShoppingmallSelleruserCartitemsCartitemoptionsController } from "./controllers/shoppingMall/sellerUser/cartItems/cartItemOptions/ShoppingmallSelleruserCartitemsCartitemoptionsController";
import { ShoppingmallGuestuserCartitemsCartitemoptionsController } from "./controllers/shoppingMall/guestUser/cartItems/cartItemOptions/ShoppingmallGuestuserCartitemsCartitemoptionsController";
import { ShoppingmallMemberuserOrdersController } from "./controllers/shoppingMall/memberUser/orders/ShoppingmallMemberuserOrdersController";
import { ShoppingmallSelleruserOrdersController } from "./controllers/shoppingMall/sellerUser/orders/ShoppingmallSelleruserOrdersController";
import { ShoppingmallAdminuserOrdersController } from "./controllers/shoppingMall/adminUser/orders/ShoppingmallAdminuserOrdersController";
import { ShoppingmallGuestuserOrdersController } from "./controllers/shoppingMall/guestUser/orders/ShoppingmallGuestuserOrdersController";
import { ShoppingmallMemberuserOrdersItemsController } from "./controllers/shoppingMall/memberUser/orders/items/ShoppingmallMemberuserOrdersItemsController";
import { ShoppingmallSelleruserOrdersItemsController } from "./controllers/shoppingMall/sellerUser/orders/items/ShoppingmallSelleruserOrdersItemsController";
import { ShoppingmallAdminuserOrdersItemsController } from "./controllers/shoppingMall/adminUser/orders/items/ShoppingmallAdminuserOrdersItemsController";
import { ShoppingmallGuestuserOrdersItemsController } from "./controllers/shoppingMall/guestUser/orders/items/ShoppingmallGuestuserOrdersItemsController";
import { ShoppingmallGuestuserOrdersPaymentsController } from "./controllers/shoppingMall/guestUser/orders/payments/ShoppingmallGuestuserOrdersPaymentsController";
import { ShoppingmallMemberuserOrdersPaymentsController } from "./controllers/shoppingMall/memberUser/orders/payments/ShoppingmallMemberuserOrdersPaymentsController";
import { ShoppingmallSelleruserOrdersPaymentsController } from "./controllers/shoppingMall/sellerUser/orders/payments/ShoppingmallSelleruserOrdersPaymentsController";
import { ShoppingmallAdminuserOrdersPaymentsController } from "./controllers/shoppingMall/adminUser/orders/payments/ShoppingmallAdminuserOrdersPaymentsController";
import { ShoppingmallAdminuserOrdersDeliveriesController } from "./controllers/shoppingMall/adminUser/orders/deliveries/ShoppingmallAdminuserOrdersDeliveriesController";
import { ShoppingmallSelleruserOrdersDeliveriesController } from "./controllers/shoppingMall/sellerUser/orders/deliveries/ShoppingmallSelleruserOrdersDeliveriesController";
import { ShoppingmallAdminuserCouponsController } from "./controllers/shoppingMall/adminUser/coupons/ShoppingmallAdminuserCouponsController";
import { ShoppingmallSelleruserCouponsController } from "./controllers/shoppingMall/sellerUser/coupons/ShoppingmallSelleruserCouponsController";
import { ShoppingmallMemberuserCouponsController } from "./controllers/shoppingMall/memberUser/coupons/ShoppingmallMemberuserCouponsController";
import { ShoppingmallAdminuserCouponsConditionsController } from "./controllers/shoppingMall/adminUser/coupons/conditions/ShoppingmallAdminuserCouponsConditionsController";
import { ShoppingmallMemberuserCouponticketsController } from "./controllers/shoppingMall/memberUser/couponTickets/ShoppingmallMemberuserCouponticketsController";
import { ShoppingmallMemberuserDepositsController } from "./controllers/shoppingMall/memberUser/deposits/ShoppingmallMemberuserDepositsController";
import { ShoppingmallMemberuserDepositchargesController } from "./controllers/shoppingMall/memberUser/depositCharges/ShoppingmallMemberuserDepositchargesController";
import { ShoppingmallMemberuserMileagesController } from "./controllers/shoppingMall/memberUser/mileages/ShoppingmallMemberuserMileagesController";
import { ShoppingmallAdminuserMileagesController } from "./controllers/shoppingMall/adminUser/mileages/ShoppingmallAdminuserMileagesController";
import { ShoppingmallAdminuserMileagedonationsController } from "./controllers/shoppingMall/adminUser/mileageDonations/ShoppingmallAdminuserMileagedonationsController";
import { ShoppingmallAdminuserInquiriesController } from "./controllers/shoppingMall/adminUser/inquiries/ShoppingmallAdminuserInquiriesController";
import { ShoppingmallMemberuserInquiriesController } from "./controllers/shoppingMall/memberUser/inquiries/ShoppingmallMemberuserInquiriesController";
import { ShoppingmallAdminuserInquiriesCommentsController } from "./controllers/shoppingMall/adminUser/inquiries/comments/ShoppingmallAdminuserInquiriesCommentsController";
import { ShoppingmallMemberuserInquiriesCommentsController } from "./controllers/shoppingMall/memberUser/inquiries/comments/ShoppingmallMemberuserInquiriesCommentsController";
import { ShoppingmallMemberuserReviewsController } from "./controllers/shoppingMall/memberUser/reviews/ShoppingmallMemberuserReviewsController";
import { ShoppingmallMemberuserReviewsCommentsController } from "./controllers/shoppingMall/memberUser/reviews/comments/ShoppingmallMemberuserReviewsCommentsController";
import { ShoppingmallSelleruserReviewsCommentsController } from "./controllers/shoppingMall/sellerUser/reviews/comments/ShoppingmallSelleruserReviewsCommentsController";
import { ShoppingmallAdminuserReviewsCommentsController } from "./controllers/shoppingMall/adminUser/reviews/comments/ShoppingmallAdminuserReviewsCommentsController";
import { ShoppingmallSelleruserSellerresponsesController } from "./controllers/shoppingMall/sellerUser/sellerResponses/ShoppingmallSelleruserSellerresponsesController";
import { ShoppingmallAdminuserSellerresponsesController } from "./controllers/shoppingMall/adminUser/sellerResponses/ShoppingmallAdminuserSellerresponsesController";
import { ShoppingmallMemberuserFavoriteproductsController } from "./controllers/shoppingMall/memberUser/favoriteProducts/ShoppingmallMemberuserFavoriteproductsController";
import { ShoppingmallMemberuserFavoriteinquiriesController } from "./controllers/shoppingMall/memberUser/favoriteInquiries/ShoppingmallMemberuserFavoriteinquiriesController";
import { ShoppingmallMemberuserFavoriteaddressesController } from "./controllers/shoppingMall/memberUser/favoriteAddresses/ShoppingmallMemberuserFavoriteaddressesController";
import { ShoppingmallMemberuserSnapshotsController } from "./controllers/shoppingMall/memberUser/snapshots/ShoppingmallMemberuserSnapshotsController";
import { ShoppingmallMemberuserOrderauditlogsController } from "./controllers/shoppingMall/memberUser/orderAuditLogs/ShoppingmallMemberuserOrderauditlogsController";
import { ShoppingmallMemberuserInventoryauditsController } from "./controllers/shoppingMall/memberUser/inventoryAudits/ShoppingmallMemberuserInventoryauditsController";
import { ShoppingmallMemberuserCouponlogsController } from "./controllers/shoppingMall/memberUser/couponLogs/ShoppingmallMemberuserCouponlogsController";
import { ShoppingmallAdminuserCouponlogsController } from "./controllers/shoppingMall/adminUser/couponLogs/ShoppingmallAdminuserCouponlogsController";
import { ShoppingmallAdminuserOrderstatushistoriesController } from "./controllers/shoppingMall/adminUser/orderStatusHistories/ShoppingmallAdminuserOrderstatushistoriesController";
import { ShoppingmallMemberuserAirecommendationsController } from "./controllers/shoppingMall/memberUser/aiRecommendations/ShoppingmallMemberuserAirecommendationsController";
import { ShoppingmallAdminuserAirecommendationsController } from "./controllers/shoppingMall/adminUser/aiRecommendations/ShoppingmallAdminuserAirecommendationsController";
import { ShoppingmallAdminuserFrauddetectionsController } from "./controllers/shoppingMall/adminUser/fraudDetections/ShoppingmallAdminuserFrauddetectionsController";
import { ShoppingmallAdminuserDynamicpricingsController } from "./controllers/shoppingMall/adminUser/dynamicPricings/ShoppingmallAdminuserDynamicpricingsController";
import { ShoppingmallAdminuserSentimentanalysisController } from "./controllers/shoppingMall/adminUser/sentimentAnalysis/ShoppingmallAdminuserSentimentanalysisController";
import { ShoppingmallAdminuserAnalyticsdashboardsController } from "./controllers/shoppingMall/adminUser/analyticsDashboards/ShoppingmallAdminuserAnalyticsdashboardsController";

@Module({
  controllers: [
    AuthGuestuserController,
    AuthMemberuserController,
    AuthSelleruserController,
    AuthSelleruserPasswordResetRequestController,
    AuthSelleruserPasswordResetConfirmController,
    AuthSelleruserPasswordChangeController,
    AuthAdminuserController,
    ShoppingmallAdminuserChannelsController,
    ShoppingmallAdminuserSectionsController,
    ShoppingmallAdminuserChannelcategoriesController,
    ShoppingmallAdminuserAttachmentsController,
    ShoppingmallAttachmentsController,
    ShoppingmallMemberuserAttachmentsController,
    ShoppingmallAdminuserGuestusersController,
    ShoppingmallAdminuserMemberusersController,
    ShoppingmallAdminuserSellerusersController,
    ShoppingmallAdminuserAdminusersController,
    ShoppingmallAdminuserSalesController,
    ShoppingmallSelleruserSalesController,
    ShoppingmallSelleruserSalesSnapshotsController,
    ShoppingmallAdminuserSalesSnapshotsController,
    ShoppingmallSelleruserSalesSaleunitsController,
    ShoppingmallAdminuserSalesSaleunitsController,
    ShoppingmallSelleruserSalesSaleunitsSaleunitoptionsController,
    ShoppingmallAdminuserSalesSaleunitsSaleunitoptionsController,
    ShoppingmallSelleruserSaleoptionsController,
    ShoppingmallAdminuserSaleoptionsController,
    ShoppingmallAdminuserSaleoptiongroupsController,
    ShoppingmallSelleruserSaleoptiongroupsController,
    ShoppingmallAdminuserInventoryController,
    ShoppingmallSelleruserInventoryController,
    ShoppingmallAdminuserCategoriesController,
    ShoppingmallAdminuserCategoriesCategoryrelationsParentController,
    ShoppingmallAdminuserCategoriesCategoryrelationsChildController,
    ShoppingmallMemberuserCartsController,
    ShoppingmallMemberuserCartsCartitemsController,
    ShoppingmallAdminuserCartsCartitemsController,
    ShoppingmallMemberuserCartitemsCartitemoptionsController,
    ShoppingmallAdminuserCartitemsCartitemoptionsController,
    ShoppingmallSelleruserCartitemsCartitemoptionsController,
    ShoppingmallGuestuserCartitemsCartitemoptionsController,
    ShoppingmallMemberuserOrdersController,
    ShoppingmallSelleruserOrdersController,
    ShoppingmallAdminuserOrdersController,
    ShoppingmallGuestuserOrdersController,
    ShoppingmallMemberuserOrdersItemsController,
    ShoppingmallSelleruserOrdersItemsController,
    ShoppingmallAdminuserOrdersItemsController,
    ShoppingmallGuestuserOrdersItemsController,
    ShoppingmallGuestuserOrdersPaymentsController,
    ShoppingmallMemberuserOrdersPaymentsController,
    ShoppingmallSelleruserOrdersPaymentsController,
    ShoppingmallAdminuserOrdersPaymentsController,
    ShoppingmallAdminuserOrdersDeliveriesController,
    ShoppingmallSelleruserOrdersDeliveriesController,
    ShoppingmallAdminuserCouponsController,
    ShoppingmallSelleruserCouponsController,
    ShoppingmallMemberuserCouponsController,
    ShoppingmallAdminuserCouponsConditionsController,
    ShoppingmallMemberuserCouponticketsController,
    ShoppingmallMemberuserDepositsController,
    ShoppingmallMemberuserDepositchargesController,
    ShoppingmallMemberuserMileagesController,
    ShoppingmallAdminuserMileagesController,
    ShoppingmallAdminuserMileagedonationsController,
    ShoppingmallAdminuserInquiriesController,
    ShoppingmallMemberuserInquiriesController,
    ShoppingmallAdminuserInquiriesCommentsController,
    ShoppingmallMemberuserInquiriesCommentsController,
    ShoppingmallMemberuserReviewsController,
    ShoppingmallMemberuserReviewsCommentsController,
    ShoppingmallSelleruserReviewsCommentsController,
    ShoppingmallAdminuserReviewsCommentsController,
    ShoppingmallSelleruserSellerresponsesController,
    ShoppingmallAdminuserSellerresponsesController,
    ShoppingmallMemberuserFavoriteproductsController,
    ShoppingmallMemberuserFavoriteinquiriesController,
    ShoppingmallMemberuserFavoriteaddressesController,
    ShoppingmallMemberuserSnapshotsController,
    ShoppingmallMemberuserOrderauditlogsController,
    ShoppingmallMemberuserInventoryauditsController,
    ShoppingmallMemberuserCouponlogsController,
    ShoppingmallAdminuserCouponlogsController,
    ShoppingmallAdminuserOrderstatushistoriesController,
    ShoppingmallMemberuserAirecommendationsController,
    ShoppingmallAdminuserAirecommendationsController,
    ShoppingmallAdminuserFrauddetectionsController,
    ShoppingmallAdminuserDynamicpricingsController,
    ShoppingmallAdminuserSentimentanalysisController,
    ShoppingmallAdminuserAnalyticsdashboardsController,
  ],
})
export class MyModule {}
