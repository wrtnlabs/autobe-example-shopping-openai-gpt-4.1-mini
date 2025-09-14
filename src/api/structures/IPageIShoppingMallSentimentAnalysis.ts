import { IPage } from "./IPage";
import { IShoppingMallSentimentAnalysis } from "./IShoppingMallSentimentAnalysis";

export namespace IPageIShoppingMallSentimentAnalysis {
  /**
   * A page.
   *
   * Collection of records with pagination information.
   */
  export type ISummary = {
    /** Page information. */
    pagination: IPage.IPagination;

    /** List of records. */
    data: IShoppingMallSentimentAnalysis.ISummary[];
  };
}
