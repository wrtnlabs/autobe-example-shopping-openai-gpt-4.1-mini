import { IPage } from "./IPage";
import { IShoppingMallCouponTicket } from "./IShoppingMallCouponTicket";

export namespace IPageIShoppingMallCouponTicket {
  /**
   * A page.
   *
   * Collection of records with pagination information.
   */
  export type ISummary = {
    /** Page information. */
    pagination: IPage.IPagination;

    /** List of records. */
    data: IShoppingMallCouponTicket.ISummary[];
  };
}
