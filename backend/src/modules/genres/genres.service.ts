import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import { Genre, GenreDocument } from './schemas/genre.schema';
import { CreateGenreDto } from './dto/create-genre.dto';
import { UpdateGenreDto } from './dto/update-genre.dto';
import { Book, BookDocument } from '../books/schemas/book.schema';

@Injectable()
export class GenresService {
  constructor(
    @InjectModel(Genre.name) private genreModel: Model<GenreDocument>,
    @InjectModel(Book.name) private bookModel: Model<BookDocument>,
  ) { }

  async findAll(query: any, current: number = 1, pageSize: number = 10) {
    // Build filter
    const filter: any = {};
    if (query.name) {
      filter.name = { $regex: query.name, $options: 'i' };
    }

    // Calculate pagination
    const skip = (current - 1) * pageSize;

    // Execute queries
    const [genres, total] = await Promise.all([
      this.genreModel
        .find(filter)
        .sort({ name: 1 })
        .skip(skip)
        .limit(pageSize)
        .lean()
        .exec(),
      this.genreModel.countDocuments(filter),
    ]);

    // Map to response format
    const data = genres.map((genre: any) => ({
      id: genre._id.toString(),
      name: genre.name,
      slug: genre.slug,
      description: genre.description,
      createdAt: genre.createdAt,
      updatedAt: genre.updatedAt,
    }));

    return {
      data,
      meta: {
        current,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  async findAllSimple() {
    const genres = await this.genreModel
      .find()
      .select('name slug')
      .sort({ name: 1 })
      .lean();

    return genres.map((genre: any) => ({
      id: genre._id.toString(),
      name: genre.name,
      slug: genre.slug,
    }));
  }

  async create(createGenreDto: CreateGenreDto) {
    // Validation
    if (!createGenreDto.name?.trim()) {
      throw new BadRequestException('Tên thể loại không được để trống');
    }

    // Check for duplicate name
    const existingGenre = await this.genreModel.findOne({
      name: createGenreDto.name.trim(),
    });

    if (existingGenre) {
      throw new ConflictException('Thể loại với tên này đã tồn tại');
    }

    // Create genre
    const newGenre = await this.genreModel.create({
      name: createGenreDto.name.trim(),
      description: createGenreDto.description?.trim() || '',
    });

    const saved = newGenre.toObject();

    return {
      id: (saved._id as Types.ObjectId).toString(),
      name: saved.name,
      slug: saved.slug,
      description: saved.description,
      createdAt: (saved as any).createdAt,
      updatedAt: (saved as any).updatedAt,
    };
  }

  async findOne(id: string) {
    // Validation
    if (!id) {
      throw new BadRequestException('ID thể loại là bắt buộc');
    }

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Định dạng ID thể loại không hợp lệ');
    }

    // Find genre
    const genre: any = await this.genreModel.findById(id).lean().exec();

    if (!genre) {
      throw new NotFoundException(`Không tìm thấy thể loại với ID "${id}"`);
    }

    return {
      id: genre._id.toString(),
      name: genre.name,
      slug: genre.slug,
      description: genre.description,
      createdAt: genre.createdAt,
      updatedAt: genre.updatedAt,
    };
  }

  async update(id: string, updateGenreDto: UpdateGenreDto) {
    // Validation
    if (!id) {
      throw new BadRequestException('ID thể loại là bắt buộc');
    }

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Định dạng ID thể loại không hợp lệ');
    }

    const existingGenre = await this.genreModel.findById(id);

    if (!existingGenre) {
      throw new NotFoundException(`Không tìm thấy thể loại với ID "${id}"`);
    }

    // Check for duplicate name if name is being changed
    if (
      updateGenreDto.name?.trim() &&
      updateGenreDto.name.trim() !== existingGenre.name
    ) {
      const duplicateGenre = await this.genreModel.findOne({
        name: updateGenreDto.name.trim(),
        _id: { $ne: id },
      });

      if (duplicateGenre) {
        throw new ConflictException('Thể loại với tên này đã tồn tại');
      }
    }

    // Build update data
    const updateData: any = {};
    if (updateGenreDto.name?.trim()) updateData.name = updateGenreDto.name.trim();
    if (updateGenreDto.description !== undefined)
      updateData.description = updateGenreDto.description.trim();

    // Update genre
    const updatedGenre: any = await this.genreModel
      .findByIdAndUpdate(id, updateData, { new: true })
      .lean()
      .exec();

    if (!updatedGenre) {
      throw new NotFoundException('Cập nhật thể loại thất bại');
    }

    return {
      id: updatedGenre._id.toString(),
      name: updatedGenre.name,
      slug: updatedGenre.slug,
      description: updatedGenre.description,
      createdAt: updatedGenre.createdAt,
      updatedAt: updatedGenre.updatedAt,
    };
  }

  async remove(id: string) {
    // Validation
    if (!id) {
      throw new BadRequestException('ID thể loại là bắt buộc');
    }

    if (!Types.ObjectId.isValid(id)) {
      throw new BadRequestException('Định dạng ID thể loại không hợp lệ');
    }

    const genre = await this.genreModel.findById(id);

    if (!genre) {
      throw new NotFoundException(`Không tìm thấy thể loại với ID "${id}"`);
    }

    // Check if any books are using this genre
    const booksCount = await this.bookModel.countDocuments({
      genres: new Types.ObjectId(id),
    });

    if (booksCount > 0) {
      throw new ConflictException(
        `Không thể xóa thể loại này vì có ${booksCount} sách đang sử dụng`,
      );
    }

    // Delete genre
    await this.genreModel.findByIdAndDelete(id);

    return { success: true };
  }
}
