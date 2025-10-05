import { BadRequestException, Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { OTP } from './schemas/otp.schema';
import { Model } from 'mongoose';
import { MailerService } from '@nestjs-modules/mailer';

@Injectable()
export class OtpService {
  constructor(
    @InjectModel(OTP.name) private otpModel: Model<OTP>,
    private readonly mailerService: MailerService,
  ) {}

  async generateOTP(email: string): Promise<string> {
    const otp = Math.floor(100000 + Math.random() * 900000).toString(); // OTP 6 chữ số
    const expiry = new Date(Date.now() + 5 * 60 * 1000); // Hết hạn sau 5 phút

    // Xóa OTP cũ nếu tồn tại
    await this.otpModel.deleteOne({ email });
    // Lưu OTP mới
    await this.otpModel.create({ email, otp, expiry });

    // Gửi email với OTP
    await this.mailerService.sendMail({
      to: email,
      subject: 'Your OTP for Registration',
      text: `Your OTP is ${otp}. It is valid for 5 minutes.`,
    });

    return otp; // Trả về OTP để test
  }

  async verifyOTP(email: string, inputOtp: string): Promise<boolean> {
    const stored = await this.otpModel.findOne({ email });
    if (!stored) {
      throw new BadRequestException('OTP not found or expired');
    }
    if (new Date() > stored.expiry) {
      await this.otpModel.deleteOne({ email });
      throw new BadRequestException('OTP expired');
    }
    if (stored.otp !== inputOtp) {
      throw new BadRequestException('Invalid OTP');
    }
    await this.otpModel.deleteOne({ email }); // Xóa OTP sau khi verify
    return true;
  }
}
