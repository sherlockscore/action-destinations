import { Analytics, Context } from '@segment/analytics-next'
import { Subscription } from '@segment/browser-destination-runtime'
import TikTokDestination, { destination } from '../../index'
import { TikTokPixel } from '../../types'

describe('TikTokPixel.reportWebEvent', () => {
  const settings = {
    pixelCode: '1234',
    useExistingPixel: false
  }

  let mockTtp: TikTokPixel
  let reportWebEvent: any
  beforeEach(async () => {
    jest.restoreAllMocks()
    jest.spyOn(destination, 'initialize').mockImplementation(() => {
      mockTtp = {
        page: jest.fn(),
        identify: jest.fn(),
        track: jest.fn(),
        instance: jest.fn(() => mockTtp)
      }
      return Promise.resolve(mockTtp)
    })
  })

  test('sends "Pageview" event', async () => {
    const subscriptions: Subscription[] = [
      {
        partnerAction: 'reportWebEvent',
        name: 'Page View',
        enabled: true,
        subscribe: 'type="page"',
        mapping: {
          event: 'Pageview'
        }
      }
    ]

    const context = new Context({
      messageId: 'ajs-71f386523ee5dfa90c7d0fda28b6b5c6',
      type: 'page',
      anonymousId: 'anonymousId',
      userId: 'userId',
      context: {
        traits: {
          last_name: 'lastName',
          first_name: 'firstName',
          address: {
            city: 'city',
            state: 'state',
            country: 'country'
          }
        }
      },
      properties: {}
    })

    const [webEvent] = await TikTokDestination({
      ...settings,
      subscriptions
    })
    reportWebEvent = webEvent

    await reportWebEvent.load(Context.system(), {} as Analytics)
    await reportWebEvent.track?.(context)

    expect(mockTtp.track).toHaveBeenCalledWith(
      'Pageview',
      {
        content_type: undefined,
        contents: [],
        currency: 'USD',
        description: undefined,
        order_id: undefined,
        query: undefined,
        shop_id: undefined,
        value: undefined
      },
      {
        event_id: ''
      }
    )
  })

  test('maps properties correctly for "PlaceAnOrder" event', async () => {
    const subscriptions: Subscription[] = [
      {
        partnerAction: 'reportWebEvent',
        name: 'Place an Order',
        enabled: true,
        subscribe: 'event = "Order Completed"',
        mapping: {
          event_id: {
            '@path': '$.messageId'
          },
          anonymousId: {
            '@path': '$.anonymousId'
          },
          external_id: {
            '@path': '$.userId'
          },
          phone_number: {
            '@path': '$.properties.phone'
          },
          email: {
            '@path': '$.properties.email'
          },
          last_name: {
            '@path': '$.context.traits.last_name'
          },
          first_name: {
            '@path': '$.context.traits.first_name'
          },
          address: {
            city: {
              '@path': '$.context.traits.address.city'
            },
            state: {
              '@path': '$.context.traits.address.state'
            },
            country: {
              '@path': '$.context.traits.address.country'
            }
          },
          groupId: {
            '@path': '$.groupId'
          },
          event: 'PlaceAnOrder',
          contents: {
            '@arrayPath': [
              '$.properties.products',
              {
                price: {
                  '@path': '$.price'
                },
                quantity: {
                  '@path': '$.quantity'
                },
                content_type: {
                  '@path': '$.category'
                },
                content_id: {
                  '@path': '$.product_id'
                }
              }
            ]
          },
          currency: {
            '@path': '$.properties.currency'
          },
          value: {
            '@path': '$.properties.value'
          },
          query: {
            '@path': '$.properties.query'
          },
          description: {
            '@path': '$.properties.description'
          }
        }
      }
    ]

    const context = new Context({
      messageId: 'ajs-71f386523ee5dfa90c7d0fda28b6b5c6',
      type: 'track',
      anonymousId: 'anonymousId',
      userId: 'userId',
      event: 'Order Completed',
      context: {
        traits: {
          last_name: 'lastName',
          first_name: 'firstName',
          address: {
            city: 'city',
            state: 'state',
            country: 'country'
          }
        }
      },
      properties: {
        products: [
          {
            product_id: '123',
            category: 'product',
            quantity: 1,
            price: 1
          },
          {
            product_id: '456',
            category: 'product',
            quantity: 2,
            price: 2
          }
        ],
        query: 'test-query',
        value: 10,
        currency: 'USD',
        phone: ['+12345678900'],
        email: ['aaa@aaa.com'],
        description: 'test-description'
      }
    })

    const [webEvent] = await TikTokDestination({
      ...settings,
      subscriptions
    })
    reportWebEvent = webEvent

    await reportWebEvent.load(Context.system(), {} as Analytics)
    await reportWebEvent.track?.(context)

    expect(mockTtp.identify).toHaveBeenCalledWith({
      city: 'city',
      country: 'country',
      email: 'aaa@aaa.com',
      phone_number: '+12345678900',
      external_id: 'userId',
      first_name: 'firstname',
      last_name: 'lastname',
      state: 'state',
      zip_code: ''
    })
    expect(mockTtp.track).toHaveBeenCalledWith(
      'PlaceAnOrder',
      {
        contents: [
          { content_id: '123', content_type: 'product', price: 1, quantity: 1 },
          { content_id: '456', content_type: 'product', price: 2, quantity: 2 }
        ],
        currency: 'USD',
        description: 'test-description',
        query: 'test-query',
        value: 10
      },
      { event_id: 'ajs-71f386523ee5dfa90c7d0fda28b6b5c6' }
    )
  })

  test('maps properties correctly for "AddToCart" event', async () => {
    const subscriptions: Subscription[] = [
      {
        partnerAction: 'reportWebEvent',
        name: 'Add to Cart',
        enabled: true,
        subscribe: 'event = "Product Added"',
        mapping: {
          event_id: {
            '@path': '$.messageId'
          },
          anonymousId: {
            '@path': '$.anonymousId'
          },
          external_id: {
            '@path': '$.userId'
          },
          phone_number: {
            '@path': '$.properties.phone'
          },
          email: {
            '@path': '$.properties.email'
          },
          last_name: {
            '@path': '$.context.traits.last_name'
          },
          first_name: {
            '@path': '$.context.traits.first_name'
          },
          address: {
            city: {
              '@path': '$.context.traits.address.city'
            },
            state: {
              '@path': '$.context.traits.address.state'
            },
            country: {
              '@path': '$.context.traits.address.country'
            }
          },
          groupId: {
            '@path': '$.groupId'
          },
          event: 'AddToCart',
          contents: {
            '@arrayPath': [
              '$.properties',
              {
                price: {
                  '@path': '$.price'
                },
                quantity: {
                  '@path': '$.quantity'
                },
                content_type: {
                  '@path': '$.category'
                },
                content_id: {
                  '@path': '$.product_id'
                }
              }
            ]
          },
          currency: {
            '@path': '$.properties.currency'
          },
          value: {
            '@path': '$.properties.value'
          },
          query: {
            '@path': '$.properties.query'
          },
          description: {
            '@path': '$.properties.description'
          }
        }
      }
    ]

    const context = new Context({
      messageId: 'ajs-71f386523ee5dfa90c7d0fda28b6b5c6',
      type: 'track',
      anonymousId: 'anonymousId',
      userId: 'userId',
      event: 'Product Added',
      context: {
        traits: {
          last_name: 'lastName',
          first_name: 'firstName',
          address: {
            city: 'city',
            state: 'state',
            country: 'country'
          }
        }
      },
      properties: {
        product_id: '123',
        category: 'product',
        quantity: 1,
        price: 1,
        query: 'test-query',
        value: 10,
        currency: 'USD',
        phone: ['+12345678900'],
        email: ['aaa@aaa.com'],
        description: 'test-description'
      }
    })

    const [webEvent] = await TikTokDestination({
      ...settings,
      subscriptions
    })
    reportWebEvent = webEvent

    await reportWebEvent.load(Context.system(), {} as Analytics)
    await reportWebEvent.track?.(context)

    expect(mockTtp.identify).toHaveBeenCalledWith({
      city: 'city',
      country: 'country',
      email: 'aaa@aaa.com',
      phone_number: '+12345678900',
      external_id: 'userId',
      first_name: 'firstname',
      last_name: 'lastname',
      state: 'state',
      zip_code: ''
    })
    expect(mockTtp.track).toHaveBeenCalledWith(
      'AddToCart',
      {
        contents: [{ content_id: '123', content_type: 'product', price: 1, quantity: 1 }],
        currency: 'USD',
        description: 'test-description',
        query: 'test-query',
        value: 10
      },
      { event_id: 'ajs-71f386523ee5dfa90c7d0fda28b6b5c6' }
    )
  })

  test('maps properties correctly for "ViewContent" event', async () => {
    const subscriptions: Subscription[] = [
      {
        partnerAction: 'reportWebEvent',
        name: 'View Content',
        enabled: true,
        subscribe: 'type="page"',
        mapping: {
          event_id: {
            '@path': '$.messageId'
          },
          anonymousId: {
            '@path': '$.anonymousId'
          },
          external_id: {
            '@path': '$.userId'
          },
          phone_number: {
            '@path': '$.properties.phone'
          },
          email: {
            '@path': '$.properties.email'
          },
          last_name: {
            '@path': '$.context.traits.last_name'
          },
          first_name: {
            '@path': '$.context.traits.first_name'
          },
          address: {
            city: {
              '@path': '$.context.traits.address.city'
            },
            state: {
              '@path': '$.context.traits.address.state'
            },
            country: {
              '@path': '$.context.traits.address.country'
            }
          },
          groupId: {
            '@path': '$.groupId'
          },
          event: 'ViewContent',
          contents: {
            '@arrayPath': [
              '$.properties',
              {
                price: {
                  '@path': '$.price'
                },
                quantity: {
                  '@path': '$.quantity'
                },
                content_type: {
                  '@path': '$.category'
                },
                content_id: {
                  '@path': '$.product_id'
                }
              }
            ]
          },
          currency: {
            '@path': '$.properties.currency'
          },
          value: {
            '@path': '$.properties.value'
          },
          query: {
            '@path': '$.properties.query'
          },
          description: {
            '@path': '$.properties.description'
          }
        }
      }
    ]

    const context = new Context({
      messageId: 'ajs-71f386523ee5dfa90c7d0fda28b6b5c6',
      type: 'page',
      anonymousId: 'anonymousId',
      userId: 'userId',
      context: {
        traits: {
          last_name: 'lastName',
          first_name: 'firstName',
          address: {
            city: 'city',
            state: 'state',
            country: 'country'
          }
        }
      },
      properties: {
        product_id: '123',
        category: 'product',
        quantity: 1,
        price: 1,
        query: 'test-query',
        value: 10,
        currency: 'USD',
        phone: ['+12345678900'],
        email: ['aaa@aaa.com'],
        description: 'test-description'
      }
    })

    const [webEvent] = await TikTokDestination({
      ...settings,
      subscriptions
    })
    reportWebEvent = webEvent

    await reportWebEvent.load(Context.system(), {} as Analytics)
    await reportWebEvent.track?.(context)

    expect(mockTtp.identify).toHaveBeenCalledWith({
      city: 'city',
      country: 'country',
      email: 'aaa@aaa.com',
      phone_number: '+12345678900',
      external_id: 'userId',
      first_name: 'firstname',
      last_name: 'lastname',
      state: 'state',
      zip_code: ''
    })
    expect(mockTtp.track).toHaveBeenCalledWith(
      'ViewContent',
      {
        contents: [{ content_id: '123', content_type: 'product', price: 1, quantity: 1 }],
        currency: 'USD',
        description: 'test-description',
        query: 'test-query',
        value: 10
      },
      { event_id: 'ajs-71f386523ee5dfa90c7d0fda28b6b5c6' }
    )
  })

  test('identifiers can be passed as strings only', async () => {
    const subscriptions: Subscription[] = [
      {
        partnerAction: 'reportWebEvent',
        name: 'Place an Order',
        enabled: true,
        subscribe: 'event = "Order Completed"',
        mapping: {
          event_id: {
            '@path': '$.messageId'
          },
          anonymousId: {
            '@path': '$.anonymousId'
          },
          external_id: {
            '@path': '$.userId'
          },
          phone_number: {
            '@path': '$.properties.phone'
          },
          email: {
            '@path': '$.properties.email'
          },
          last_name: {
            '@path': '$.context.traits.last_name'
          },
          first_name: {
            '@path': '$.context.traits.first_name'
          },
          address: {
            city: {
              '@path': '$.context.traits.address.city'
            },
            state: {
              '@path': '$.context.traits.address.state'
            },
            country: {
              '@path': '$.context.traits.address.country'
            }
          },
          groupId: {
            '@path': '$.groupId'
          },
          event: 'PlaceAnOrder',
          contents: {
            '@arrayPath': [
              '$.properties.products',
              {
                price: {
                  '@path': '$.price'
                },
                quantity: {
                  '@path': '$.quantity'
                },
                content_type: {
                  '@path': '$.category'
                },
                content_id: {
                  '@path': '$.product_id'
                }
              }
            ]
          },
          currency: {
            '@path': '$.properties.currency'
          },
          value: {
            '@path': '$.properties.value'
          },
          query: {
            '@path': '$.properties.query'
          },
          description: {
            '@path': '$.properties.description'
          }
        }
      }
    ]

    const context = new Context({
      messageId: 'ajs-71f386523ee5dfa90c7d0fda28b6b5c6',
      type: 'track',
      anonymousId: 'anonymousId',
      userId: 'userId',
      event: 'Order Completed',
      context: {
        traits: {
          last_name: 'lastName',
          first_name: 'firstName',
          address: {
            city: 'city',
            state: 'state',
            country: 'country'
          }
        }
      },
      properties: {
        products: [
          {
            product_id: '123',
            category: 'product',
            quantity: 1,
            price: 1
          },
          {
            product_id: '456',
            category: 'product',
            quantity: 2,
            price: 2
          }
        ],
        query: 'test-query',
        value: 10,
        currency: 'USD',
        phone: '+12345678900',
        email: 'aaa@aaa.com',
        description: 'test-description'
      }
    })

    const [webEvent] = await TikTokDestination({
      ...settings,
      subscriptions
    })
    reportWebEvent = webEvent

    await reportWebEvent.load(Context.system(), {} as Analytics)
    await reportWebEvent.track?.(context)

    expect(mockTtp.identify).toHaveBeenCalledWith({
      city: 'city',
      country: 'country',
      email: 'aaa@aaa.com',
      phone_number: '+12345678900',
      external_id: 'userId',
      first_name: 'firstname',
      last_name: 'lastname',
      state: 'state',
      zip_code: ''
    })
    expect(mockTtp.track).toHaveBeenCalledWith(
      'PlaceAnOrder',
      {
        contents: [
          { content_id: '123', content_type: 'product', price: 1, quantity: 1 },
          { content_id: '456', content_type: 'product', price: 2, quantity: 2 }
        ],
        currency: 'USD',
        description: 'test-description',
        query: 'test-query',
        value: 10
      },
      { event_id: 'ajs-71f386523ee5dfa90c7d0fda28b6b5c6' }
    )
  })
})
