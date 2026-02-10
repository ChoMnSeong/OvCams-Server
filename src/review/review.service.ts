import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { UserCampingReviewsEntity } from './entity/review.entity';
import { Repository } from 'typeorm';
import { AuthEntity } from 'src/auth/entity/auth.entity';
import { CampingEntity } from 'src/camping/entity/camping.entity';
import { AuthService } from 'src/auth/auth.service';

@Injectable()
export class ReviewService {
  constructor(
    @InjectRepository(UserCampingReviewsEntity)
    private userCampingReviewEntity: Repository<UserCampingReviewsEntity>,
    @InjectRepository(AuthEntity) private authEntity: Repository<AuthEntity>,
    @InjectRepository(CampingEntity)
    private campingEntity: Repository<CampingEntity>,
    private authService: AuthService,
  ) {}

  async review(token: string, campingID: string, content: string) {
    const { email } = await this.authService.validateAccess(token);
    const user = await this.authEntity.findOneBy({ email });
    const camping = await this.campingEntity.findOneBy({
      campingID: parseInt(campingID),
    });

    if (!camping) {
      throw new NotFoundException('Camping not found');
    }

    const savedReview = await this.userCampingReviewEntity.save({
      user,
      camping,
      content,
    });

    return savedReview;
  }

  async getAllReviewed(token: string) {
    const { email } = await this.authService.validateAccess(token);
    const user = await this.authEntity.findOneBy({ email });
    const existingReview = await this.userCampingReviewEntity.find({
      where: { user },
      relations: ['camping'],
    });
    return existingReview.map((review) => ({
      id: review.id,
      content: review.content,
      ...review.camping,
    }));
  }
}
