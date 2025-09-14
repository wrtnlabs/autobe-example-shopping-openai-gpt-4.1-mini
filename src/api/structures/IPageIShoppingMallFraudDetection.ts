import { IPage } from "./IPage";
import { IShoppingMallFraudDetection } from "./IShoppingMallFraudDetection";

export namespace IPageIShoppingMallFraudDetection {
  /**
   * A page.
   *
   * Collection of records with pagination information.
   */
  export type ISummary = {
    /** Page information. */
    pagination: IPage.IPagination;

    /** List of records. */
    data: IShoppingMallFraudDetection.ISummary[];
  };
}
