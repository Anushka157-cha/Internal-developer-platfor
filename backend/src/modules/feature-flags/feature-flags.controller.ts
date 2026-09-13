import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete,
  UseGuards,
  Request,
} from '@nestjs/common';
import { FeatureFlagsService } from './feature-flags.service';
import { CreateFeatureFlagDto } from './dto/create-feature-flag.dto';
import { UpdateFeatureFlagDto } from './dto/update-feature-flag.dto';
import { EvaluateFeatureFlagDto } from './dto/evaluate-feature-flag.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { UserRole } from '../../common/enums/user-role.enum';

@Controller('feature-flags')
@UseGuards(JwtAuthGuard, RolesGuard)
export class FeatureFlagsController {
  constructor(private readonly featureFlagsService: FeatureFlagsService) {}

  @Post()
  @Roles(UserRole.ADMIN, UserRole.DEVELOPER)
  create(@Body() createFeatureFlagDto: CreateFeatureFlagDto, @Request() req) {
    return this.featureFlagsService.create(createFeatureFlagDto, req.user.id);
  }

  @Get()
  findAll() {
    return this.featureFlagsService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.featureFlagsService.findOne(id);
  }

  @Patch(':id')
  @Roles(UserRole.ADMIN, UserRole.DEVELOPER)
  update(
    @Param('id') id: string, 
    @Body() updateFeatureFlagDto: UpdateFeatureFlagDto,
    @Request() req,
  ) {
    return this.featureFlagsService.update(id, updateFeatureFlagDto, req.user.id);
  }

  @Post(':id/toggle')
  @Roles(UserRole.ADMIN, UserRole.DEVELOPER)
  toggle(@Param('id') id: string, @Request() req) {
    return this.featureFlagsService.toggle(id, req.user.id);
  }

  @Delete(':id')
  @Roles(UserRole.ADMIN)
  remove(@Param('id') id: string, @Request() req) {
    return this.featureFlagsService.remove(id, req.user.id);
  }

  @Post('evaluate')
  evaluate(@Body() evaluateDto: EvaluateFeatureFlagDto) {
    return this.featureFlagsService.evaluate(evaluateDto);
  }
}
