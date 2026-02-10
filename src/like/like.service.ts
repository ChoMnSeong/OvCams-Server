import { Repository } from 'typeorm';
import { UserCampingLikesEntity } from './entity/like.entity';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { AuthService } from 'src/auth/auth.service';
import { AuthEntity } from 'src/auth/entity/auth.entity';
import { CampingEntity } from 'src/camping/entity/camping.entity';

@Injectable()
export class LikeService {
  constructor(
    @InjectRepository(UserCampingLikesEntity)
    private userCampingLikesEntity: Repository<UserCampingLikesEntity>,
    @InjectRepository(AuthEntity) private authEntity: Repository<AuthEntity>,
    @InjectRepository(CampingEntity)
    private campingEntity: Repository<CampingEntity>,
    private authService: AuthService,
  ) {
    this.userCampingLikesEntity = userCampingLikesEntity;
    this.authService = authService;
    this.campingEntity = campingEntity;
  }

  async like(token: string, campingID: string) {
    const { email } = await this.authService.validateAccess(token);
    const user = await this.authEntity.findOneBy({ email });
    const camping = await this.campingEntity.findOneBy({
      campingID: parseInt(campingID),
    });

    let existingLike = await this.userCampingLikesEntity.findOne({
      where: {
        camping: { campingID: parseInt(campingID) },
        user: { userID: user.userID },
      },
    });

    if (existingLike) {
      await this.userCampingLikesEntity.update(existingLike, {
        is_Valid: !existingLike.is_Valid,
      });

      await this.campingEntity.update(
        { campingID: parseInt(campingID) },
        {
          like_count: existingLike.is_Valid
            ? camping.like_count - 1
            : camping.like_count + 1,
        },
      );
    } else {
      existingLike = await this.userCampingLikesEntity.create({
        camping,
        user,
        is_Valid: true,
      });
      await this.userCampingLikesEntity.save(existingLike);
      await this.campingEntity.update(
        { campingID: parseInt(campingID) },
        {
          like_count: camping.like_count + 1,
        },
      );
    }

    return existingLike;
  }

  async getAllLike(token: string) {
    const { email } = await this.authService.validateAccess(token);
    const user = await this.authEntity.findOneBy({ email });
    const existingLikes = await this.userCampingLikesEntity.find({
      where: { user },
      relations: ['camping'],
    });

    const validLikes = existingLikes.filter((like) => like.is_Valid === true);

    return validLikes.map((like) => {
      const camping = like.camping;
      camping.like = true;
      return camping;
    });
  }
}
