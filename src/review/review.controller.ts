import { Body, Controller, Post, Headers, Param, Get } from '@nestjs/common';
import { ReviewService } from './review.service';
import { ReviewDto } from './dto/review.dto';

@Controller('review')
export class ReviewController {
  constructor(private reviewService: ReviewService) {
    this.reviewService = reviewService;
  }

  @Post('/:campingID')
  async postReview(
    @Headers('Authorization') token: any,
    @Param('campingID') id: string,
    @Body() content: ReviewDto,
  ): Promise<object> {
    const data = await this.reviewService.review(token, id, content.content);
    return Object.assign({
      data,
      statusCode: 201,
      statusMsg: '댓글 작성 성공',
    });
  }

  @Get('/')
  async getAllReviewedCamping(@Headers('Authorization') token: any) {
    const data = await this.reviewService.getAllReviewed(token);
    return Object.assign({
      data,
      statusCode: 200,
      statusMsg: '조회 성공',
    });
  }
}
