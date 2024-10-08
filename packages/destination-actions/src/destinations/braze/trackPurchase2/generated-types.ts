// Generated file. DO NOT MODIFY IT BY HAND.

export interface Payload {
  /**
   * The unique user identifier
   */
  external_id?: string
  /**
   * A user alias object. See [the docs](https://www.braze.com/docs/api/objects_filters/user_alias_object/).
   */
  user_alias?: {
    alias_name?: string
    alias_label?: string
  }
  /**
   * The user email
   */
  email?: string
  /**
   * The unique user identifier
   */
  braze_id?: string | null
  /**
   * When the event occurred.
   */
  time: string | number
  /**
   * Products purchased
   */
  products: {
    product_id: string
    currency?: string
    price: number
    quantity?: number
    [k: string]: unknown
  }[]
  /**
   * Properties of the event
   */
  properties?: {
    [k: string]: unknown
  }
  /**
   * If true, Segment will batch events before sending to Braze’s user track endpoint. Braze accepts batches of up to 75 events.
   */
  enable_batching?: boolean
  /**
   * Maximum number of events to include in each batch. Actual batch sizes may be lower.
   */
  batch_size?: number
}
