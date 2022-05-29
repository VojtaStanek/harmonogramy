import { createSchema } from '@contember/schema-definition'
import { Schema } from '@contember/schema'
import * as modelDefinition from './model'

const schema: Schema = createSchema(modelDefinition)

export default schema
