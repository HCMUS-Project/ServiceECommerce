import { Controller } from '@nestjs/common';
import { GrpcMethod, MessagePattern, Payload } from '@nestjs/microservices';
import { ReviewService } from './review.service';
import {
    ICreateReviewRequest,
    ICreateReviewResponse,
    IDeleteReviewRequest,
    IDeleteReviewResponse,
    IFindAllReviewRequest,
    IFindAllReviewResponse,
    IUpdateReviewRequest,
    IUpdateReviewResponse,
} from './interface/review.interface';

@Controller()
export class ReviewController {
    constructor(private readonly reviewService: ReviewService) {}

    @GrpcMethod('ReviewService', 'CreateReview')
    async create(data: ICreateReviewRequest): Promise<ICreateReviewResponse> {
        return await this.reviewService.create(data);
    }

    @GrpcMethod('ReviewService', 'FindAllReviews')
    async findAll(data: IFindAllReviewRequest): Promise<IFindAllReviewResponse> {
        return await this.reviewService.findAll(data);
    }

    @GrpcMethod('ReviewService', 'UpdateReview')
    async update(data: IUpdateReviewRequest): Promise<IUpdateReviewResponse> {
        return await this.reviewService.update(data);
    }

    @GrpcMethod('ReviewService', 'DeleteReview')
    async delete(data: IDeleteReviewRequest): Promise<IDeleteReviewResponse> {
        return await this.reviewService.remove(data);
    }
}
