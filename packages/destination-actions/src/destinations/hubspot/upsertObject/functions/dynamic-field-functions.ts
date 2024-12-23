import { RequestClient } from '@segment/actions-core'
import { HubSpotError } from '../../errors'
import { HUBSPOT_BASE_URL } from '../../properties'
import { SUPPORTED_HUBSPOT_OBJECT_TYPES } from '../constants'
import { DynamicFieldResponse } from '@segment/actions-core'
import { Payload } from '../generated-types'
import { DynamicFieldContext } from '@segment/actions-core/destination-kittypes'

enum AssociationCategory {
  HUBSPOT_DEFINED = 'HUBSPOT_DEFINED',
  USER_DEFINED = 'USER_DEFINED',
  INTEGRATOR_DEFINED = 'INTEGRATOR_DEFINED'
}

export const dynamicFields = {
  object_details: {
    object_type: async (request: RequestClient) => {
      return await dynamicReadObjectTypes(request)
    },
    id_field_name: async (request: RequestClient, { payload }: { payload: Payload }) => {
      const fromObjectType = payload?.object_details?.object_type

      if (!fromObjectType) {
        throw new Error("Select a value from the 'Object Type' field")
      }

      return await dynamicReadIdFields(request, fromObjectType)
    },
    property_group: async (request: RequestClient, { payload }: { payload: Payload }) => {
      const fromObjectType = payload?.object_details?.object_type

      if (!fromObjectType) {
        throw new Error("Select a value from the 'Object Type' field")
      }

      return await dynamicReadPropertyGroups(request, fromObjectType)
    }
  },
  properties: {
    __keys__: async (request: RequestClient, { payload }: { payload: Payload }) => {
      const fromObjectType = payload?.object_details?.object_type

      if (!fromObjectType) {
        throw new Error("Select a value from the 'Object Type' field")
      }

      return await dynamicReadProperties(request, fromObjectType, false)
    }
  },
  sensitive_properties: {
    __keys__: async (request: RequestClient, { payload }: { payload: Payload }) => {
      const fromObjectType = payload?.object_details?.object_type

      if (!fromObjectType) {
        throw new Error("Select a value from the 'Object Type' field")
      }

      return await dynamicReadProperties(request, fromObjectType, true)
    }
  },
  associations: {
    object_type: async (request: RequestClient) => {
      return await dynamicReadObjectTypes(request)
    },
    association_label: async (
      request: RequestClient,
      { dynamicFieldContext, payload }: { dynamicFieldContext?: DynamicFieldContext; payload: Payload }
    ) => {
      const selectedIndex = dynamicFieldContext?.selectedArrayIndex

      if (selectedIndex === undefined) {
        throw new Error('Selected array index is missing')
      }

      const fromObjectType = payload?.object_details?.object_type
      const toObjectType = payload?.associations?.[selectedIndex]?.object_type

      if (!fromObjectType) {
        throw new Error("Select a value from the from 'Object Type' field")
      }

      if (!toObjectType) {
        throw new Error("Select a value from the 'To Object Type' field")
      }

      return await dynamicReadAssociationLabels(request, fromObjectType, toObjectType)
    },
    id_field_name: async (
      request: RequestClient,
      { dynamicFieldContext, payload }: { dynamicFieldContext?: DynamicFieldContext; payload: Payload }
    ) => {
      const selectedIndex = dynamicFieldContext?.selectedArrayIndex

      if (selectedIndex === undefined) {
        throw new Error('Selected array index is missing')
      }

      const toObjectType = payload?.associations?.[selectedIndex]?.object_type

      if (!toObjectType) {
        throw new Error("Select a value from the 'To Object Type' field")
      }

      return await dynamicReadIdFields(request, toObjectType)
    }
  }
}

async function dynamicReadIdFields(request: RequestClient, objectType: string): Promise<DynamicFieldResponse> {
  interface ResultItem {
    label: string
    name: string
    hasUniqueValue: boolean
  }

  interface ResponseType {
    data: {
      results: ResultItem[]
    }
  }

  try {
    const response: ResponseType = await request(`${HUBSPOT_BASE_URL}/crm/v3/properties/${objectType}`, {
      method: 'GET',
      skipResponseCloning: true
    })

    return {
      choices: [
        {
          label: 'Hubspot Record ID (updates only)',
          value: 'hs_object_id'
        },
        ...(['contact', 'contacts'].includes(objectType)
          ? [
              {
                label: 'email',
                value: 'email'
              }
            ]
          : []),
        // hs_unique_creation_key is a unique identifier that is automatically generated by HubSpot. It is readonly so should not be included in the dynamic list
        ...response.data.results
          .filter((field: ResultItem) => field.hasUniqueValue && field.name != 'hs_unique_creation_key')
          .map((field: ResultItem) => {
            return {
              label: field.label,
              value: field.name
            }
          })
          .sort((a, b) => {
            const labelA = a.label.toLowerCase()
            const labelB = b.label.toLowerCase()
            if (labelA < labelB) {
              return -1
            }
            if (labelA > labelB) {
              return 1
            }
            return 0
          })
      ]
    }
  } catch (err) {
    const code: string = (err as HubSpotError)?.response?.status ? String((err as HubSpotError).response.status) : '500'

    return {
      choices: [],
      error: {
        message: (err as HubSpotError)?.response?.data?.message ?? 'Unknown error: dynamicReadIdFields',
        code: code
      }
    }
  }
}

async function dynamicReadPropertyGroups(request: RequestClient, objectType: string): Promise<DynamicFieldResponse> {
  interface ResultItem {
    label: string
    name: string
    displayOrder: number
    archived: boolean
  }

  interface ResponseType {
    data: {
      results: ResultItem[]
    }
  }

  try {
    const response: ResponseType = await request(`${HUBSPOT_BASE_URL}/crm/v3/properties/${objectType}/groups`, {
      method: 'GET',
      skipResponseCloning: true
    })

    return {
      choices: response.data.results
        .filter((result) => !result.archived)
        .map((result) => ({
          label: result.label,
          value: result.name
        }))
        .sort((a, b) => {
          const labelA = a.label.toLowerCase()
          const labelB = b.label.toLowerCase()
          if (labelA < labelB) {
            return -1
          }
          if (labelA > labelB) {
            return 1
          }
          return 0
        })
    }
  } catch (err) {
    const code: string = (err as HubSpotError)?.response?.status ? String((err as HubSpotError).response.status) : '500'

    return {
      choices: [],
      error: {
        message: (err as HubSpotError)?.response?.data?.message ?? 'Unknown error: dynamicReadPropertyGroups',
        code: code
      }
    }
  }
}

async function dynamicReadAssociationLabels(
  request: RequestClient,
  fromObjectType: string,
  toObjectType: string
): Promise<DynamicFieldResponse> {
  interface ResultItem {
    category: AssociationCategory
    typeId: number
    label: string
  }
  interface ResponseType {
    data: {
      results: ResultItem[]
    }
  }

  try {
    const response: ResponseType = await request(
      `${HUBSPOT_BASE_URL}/crm/v4/associations/${fromObjectType}/${toObjectType}/labels`,
      {
        method: 'GET',
        skipResponseCloning: true
      }
    )

    return {
      choices: response?.data?.results
        ?.map((res) => ({
          label: !res.label
            ? `${fromObjectType} to ${toObjectType} (Type ${res.typeId})`
            : `${fromObjectType} to ${toObjectType} ${res.label}`,
          value: `${res.category}:${res.typeId}`
        }))
        .sort((a, b) => {
          const labelA = a.label.toLowerCase()
          const labelB = b.label.toLowerCase()
          if (labelA < labelB) {
            return -1
          }
          if (labelA > labelB) {
            return 1
          }
          return 0
        })
    }
  } catch (err) {
    const code: string = (err as HubSpotError)?.response?.status ? String((err as HubSpotError).response.status) : '500'

    return {
      choices: [],
      error: {
        message: (err as HubSpotError)?.response?.data?.message ?? 'Unknown error: dynamicReadAssociationLabels',
        code: code
      }
    }
  }
}

async function dynamicReadObjectTypes(request: RequestClient): Promise<DynamicFieldResponse> {
  interface ResultItem {
    labels: { singular: string; plural: string }
    fullyQualifiedName: string
  }

  interface ResponseType {
    data: {
      results: ResultItem[]
    }
  }

  try {
    const response: ResponseType = await request(`${HUBSPOT_BASE_URL}/crm/v3/schemas?archived=false`, {
      method: 'GET',
      skipResponseCloning: true
    })
    const choices = response.data.results
      .map((schema) => ({
        label: `${schema.labels.plural} (Custom)`,
        value: schema.fullyQualifiedName
      }))
      .sort((a, b) => {
        if (a.label < b.label) {
          return -1
        }
        if (a.label > b.label) {
          return 1
        }
        return 0
      })
    return {
      choices: [...choices, ...SUPPORTED_HUBSPOT_OBJECT_TYPES]
    }
  } catch (err) {
    const code: string = (err as HubSpotError)?.response?.status ? String((err as HubSpotError).response.status) : '500'

    return {
      choices: [],
      error: {
        message: (err as HubSpotError)?.response?.data?.message ?? 'Unknown error: dynamicReadObjectTypes',
        code: code
      }
    }
  }
}

async function dynamicReadProperties(
  request: RequestClient,
  objectType: string,
  sensitive: boolean
): Promise<DynamicFieldResponse> {
  interface ResultItem {
    label: string
    name: string
    type: string
    hasUniqueValue: boolean
    modificationMetadata: {
      readOnlyValue: boolean
    }
  }

  interface ResponseType {
    data: {
      results: ResultItem[]
    }
  }

  try {
    const url = `${HUBSPOT_BASE_URL}/crm/v3/properties/${objectType}${sensitive ? '?dataSensitivity=sensitive' : ''}`
    const response: ResponseType = await request(url, {
      method: 'GET',
      skipResponseCloning: true
    })

    return {
      choices: [
        ...response.data.results
          .filter((field: ResultItem) => !field.hasUniqueValue && field.modificationMetadata.readOnlyValue === false)
          .map((field: ResultItem) => {
            return {
              label: `${field.label} - ${field.type}`,
              value: field.name
            }
          })
          .sort((a, b) => {
            const labelA = a.label.toLowerCase()
            const labelB = b.label.toLowerCase()
            if (labelA < labelB) {
              return -1
            }
            if (labelA > labelB) {
              return 1
            }
            return 0
          })
      ]
    }
  } catch (err) {
    const code: string = (err as HubSpotError)?.response?.status ? String((err as HubSpotError).response.status) : '500'

    return {
      choices: [],
      error: {
        message: (err as HubSpotError)?.response?.data?.message ?? 'Unknown error: dynamicReadProperties',
        code: code
      }
    }
  }
}
