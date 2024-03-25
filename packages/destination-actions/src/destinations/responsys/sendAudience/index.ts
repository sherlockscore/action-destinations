import { ActionDefinition } from '@segment/actions-core'
import type { Settings } from '../generated-types'
import type { Payload } from './generated-types'
import { enable_batching, batch_size } from '../shared_properties'
import { sendCustomTraits, getUserDataFieldNames, validateCustomTraits, validateListMemberPayload } from '../utils'
import { Data } from '../types'

const action: ActionDefinition<Settings, Payload> = {
  title: 'Send Audience',
  description: 'Send Engage Audience to a Profile Extension Table in Responsys',
  defaultSubscription: 'type = "identify" or type = "track"',
  fields: {
    userData: {
      label: 'Recipient Data',
      description: 'Record data that represents field names and corresponding values for each profile.',
      type: 'object',
      defaultObjectUI: 'keyvalue',
      required: true,
      additionalProperties: true,
      properties: {
        EMAIL_ADDRESS_: {
          label: 'Email address',
          description: "The user's email address",
          type: 'string',
          format: 'email',
          required: false
        },
        CUSTOMER_ID_: {
          label: 'Customer ID',
          description: 'Responsys Customer ID.',
          type: 'string',
          required: false
        }
      },
      default: {
        EMAIL_ADDRESS_: {
          '@if': {
            exists: { '@path': '$.traits.email' },
            then: { '@path': '$.traits.email' },
            else: { '@path': '$.context.traits.email' }
          }
        },
        CUSTOMER_ID_: { '@path': '$.userId' }
      }
    },
    computation_key: {
      label: 'Segment Audience Key',
      description: 'A unique identifier assigned to a specific audience in Segment.',
      type: 'string',
      required: true,
      unsafe_hidden: true,
      default: { '@path': '$.context.personas.computation_key' }
    },
    traits_or_props: {
      label: 'Traits or Properties',
      description: 'Hidden field used to access traits or properties objects from Engage payloads.',
      type: 'object',
      required: true,
      unsafe_hidden: true,
      default: {
        '@if': {
          exists: { '@path': '$.traits' },
          then: { '@path': '$.traits' },
          else: { '@path': '$.properties' }
        }
      }
    },
    computation_class: {
      label: 'Segment Audience Computation Class',
      description:
        "Hidden field used to verify that the payload is generated by an Audience. Payloads not containing computation_class = 'audience' will be dropped before the perform() fuction call.",
      type: 'string',
      required: true,
      unsafe_hidden: true,
      default: { '@path': '$.context.personas.computation_class' },
      choices: [{ label: 'Audience', value: 'audience' }]
    },
    enable_batching: enable_batching,
    batch_size: batch_size,
    stringify: {
      label: 'Stringify Recipient Data',
      description: 'If true, all Recipient data will be converted to strings before being sent to Responsys.',
      type: 'boolean',
      required: true,
      default: false
    },
    timestamp: {
      label: 'Timestamp',
      description: 'The timestamp of when the event occurred.',
      type: 'datetime',
      required: true,
      unsafe_hidden: true,
      default: {
        '@path': '$.timestamp'
      }
    }
  },

  perform: async (request, data) => {
    const { payload, settings, statsContext } = data

    const userDataFieldNames: string[] = getUserDataFieldNames(data as unknown as Data)
    validateCustomTraits({ profileExtensionTable: settings.profileExtensionTable, timestamp: payload.timestamp, statsContext: statsContext })
    validateListMemberPayload(payload.userData)

    return sendCustomTraits(request, [payload], data.settings, userDataFieldNames, true)
  },

  performBatch: async (request, data) => {
    const { payload, settings, statsContext } = data

    const userDataFieldNames = getUserDataFieldNames(data as unknown as Data)
    validateCustomTraits({ profileExtensionTable: settings.profileExtensionTable, timestamp: payload[0].timestamp, statsContext: statsContext })

    return sendCustomTraits(request, data.payload, data.settings, userDataFieldNames, true)
  }
}

export default action