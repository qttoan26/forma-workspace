import { Module } from '@nestjs/common'

import { DeliveryRelationshipController } from './delivery-relationship.controller'
import { DeliveryRelationshipService } from './delivery-relationship.service'

@Module({
  controllers: [DeliveryRelationshipController],
  providers: [DeliveryRelationshipService],
  exports: [DeliveryRelationshipService],
})
export class DeliveryModule {}
