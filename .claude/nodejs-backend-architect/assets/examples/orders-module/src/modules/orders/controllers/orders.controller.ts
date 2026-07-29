import {
  Controller, Get, Post, Put, Delete,
  Param, Body, Query, UseGuards, ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags, ApiOperation, ApiResponse, ApiBearerAuth, ApiParam,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../../common/guards/jwt-auth.guard';
import { RolesGuard } from '../../../common/guards/roles.guard';
import { Roles } from '../../../common/decorators/roles.decorator';
import { CurrentUser } from '../../../common/decorators/current-user.decorator';
import { CreateOrderDto } from '../dtos/create-order.dto';
import { UpdateOrderDto } from '../dtos/update-order.dto';
import { QueryOrderDto } from '../dtos/query-order.dto';
import { CreateOrderUseCase } from '../usecases/create-order.usecase';
import { GetOrderUseCase } from '../usecases/get-order.usecase';
import { ListOrdersUseCase } from '../usecases/list-orders.usecase';
import { CancelOrderUseCase } from '../usecases/cancel-order.usecase';

/**
 * Controller responsibilities:
 * - Parse HTTP input
 * - Call exactly ONE UseCase per method
 * - Return the result (TransformInterceptor wraps it in the envelope)
 *
 * No business logic here. No database calls. No conditional branching.
 */
@ApiTags('Orders')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('api/v1/orders')
export class OrdersController {
  constructor(
    private readonly createOrder: CreateOrderUseCase,
    private readonly getOrder: GetOrderUseCase,
    private readonly listOrders: ListOrdersUseCase,
    private readonly cancelOrder: CancelOrderUseCase,
  ) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, description: 'Order created successfully' })
  @ApiResponse({ status: 400, description: 'Validation error' })
  @ApiResponse({ status: 422, description: 'Business rule violation (e.g., insufficient stock)' })
  async create(
    @CurrentUser('id') userId: string,
    @Body() dto: CreateOrderDto,
  ) {
    return this.createOrder.execute({ ...dto, userId });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Order found' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.getOrder.execute({ id, userId });
  }

  @Get()
  @ApiOperation({ summary: 'List orders with cursor pagination' })
  @ApiResponse({ status: 200, description: 'Paginated order list' })
  async findAll(
    @Query() query: QueryOrderDto,
    @CurrentUser('id') userId: string,
  ) {
    return this.listOrders.execute({ ...query, userId });
  }

  @Post(':id/cancel')
  @ApiOperation({ summary: 'Cancel an order' })
  @ApiParam({ name: 'id', type: 'string', format: 'uuid' })
  @ApiResponse({ status: 200, description: 'Order cancelled' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiResponse({ status: 422, description: 'Order cannot be cancelled in current status' })
  async cancel(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser('id') userId: string,
  ) {
    return this.cancelOrder.execute({ id, userId });
  }

  // ADMIN: List all orders across users
  @Get('admin/all')
  @Roles('ADMIN', 'OPERATOR')
  @ApiOperation({ summary: '[Admin] List all orders' })
  @ApiResponse({ status: 200, description: 'Paginated order list' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  async adminListAll(@Query() query: QueryOrderDto) {
    return this.listOrders.execute({ ...query }); // no userId filter
  }
}
