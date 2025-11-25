import { Injectable, Logger } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model, Types } from 'mongoose';
import {
    TextToSpeech,
    TextToSpeechDocument,
    TTSStatus,
    TTSVoiceType,
} from '@/src/modules/text-to-speech/schemas/textToSpeech.schema';

@Injectable()
export class TextToSpeechSeed {
    private readonly logger = new Logger(TextToSpeechSeed.name);

    constructor(
        @InjectModel(TextToSpeech.name)
        private textToSpeechModel: Model<TextToSpeechDocument>,
    ) { }

    async run() {
        try {
            this.logger.log('🔊 Seeding text-to-speech data...');

            const existingTTS = await this.textToSpeechModel.countDocuments();
            if (existingTTS > 0) {
                this.logger.log('⏭️  Text-to-speech data already exists, skipping...');
                return;
            }

            const ttsData = [
                {
                    chapterId: new Types.ObjectId('69213ee60ef5f6c236d6d426'),
                    bookId: new Types.ObjectId('69213ee60ef5f6c236d6d41b'),
                    text: 'As they ventured deeper into the unknown, mysteries began to unfold. Each step brought new challenges and discoveries that tested their courage and determination.\n\nThe landscape transformed around them, revealing ancient secrets and hidden powers. What started as a simple quest was becoming something far greater than anyone could have imagined.\n\nWith newfound allies and growing wisdom, our hero pressed onward. The path ahead was uncertain, but their resolve had never been stronger.',
                    paragraphCount: 3,
                    voice: 'en-US',
                    voiceType: TTSVoiceType.NEUTRAL,
                    speed: 1,
                    pitch: 0,
                    volumeGainDb: 0,
                    language: 'en-US',
                    status: TTSStatus.COMPLETED,
                    playCount: 9,
                    characterCount: 486,
                    audioFormat: 'mp3',
                    audioUrl:
                        'https://res.cloudinary.com/dmcg6uu1f/video/upload/v1763975841/tts/lq3t33szysag3eigahno.mp3',
                    processedAt: new Date('2025-11-24T09:17:23.410Z'),
                    provider: 'voicerss',
                    lastPlayedAt: new Date('2025-11-24T16:19:45.930Z'),
                },
                {
                    chapterId: new Types.ObjectId('69213ee60ef5f6c236d6d42b'),
                    bookId: new Types.ObjectId('69213ee60ef5f6c236d6d41b'),
                    text: 'Căn gác xép cũ kỹ chìm trong mùi ẩm mốc và bụi thời gian. Ánh nắng chiều xiên qua khung cửa sổ mờ đục, vẽ nên những vệt vàng nhạt nhòa trên sàn gỗ. Hà chạm tay vào chiếc hộp thiếc màu xanh lục đã rỉ sét, nằm khuất sau chồng sách cũ. Chiếc hộp này đã theo cô suốt hai mươi năm, nhưng chưa bao giờ cô đủ can đảm để mở nó.\n\nKhi nắp hộp bật mở, một làn bụi mịn màng bay lên, mang theo hương thơm dịu nhẹ của giấy cũ và hoa khô. Bên trong là một thế giới nhỏ bé: một bức ảnh chụp hai đứa trẻ đang cười tít mắt dưới gốc cây bàng vào ngày tốt nghiệp tiểu học, một cánh hoa hồng đã ép khô và phai màu, và một chiếc đồng hồ cát nhỏ xíu, chỉ còn lại một chút cát đỏ lóng lánh ở đáy.',
                    paragraphCount: 2,
                    voice: 'vi-VN',
                    voiceType: TTSVoiceType.NEUTRAL,
                    speed: 1,
                    pitch: 0,
                    volumeGainDb: 0,
                    language: 'vi-VN',
                    status: TTSStatus.COMPLETED,
                    playCount: 4,
                    characterCount: 672,
                    audioFormat: 'mp3',
                    audioUrl:
                        'https://res.cloudinary.com/dmcg6uu1f/video/upload/v1763976574/tts/fsodtgj2ahvgskioyjik.mp3',
                    processedAt: new Date('2025-11-24T09:29:37.104Z'),
                    provider: 'voicerss',
                    lastPlayedAt: new Date('2025-11-24T12:50:13.087Z'),
                },
                {
                    chapterId: new Types.ObjectId('69213ee60ef5f6c236d6d430'),
                    bookId: new Types.ObjectId('69213ee60ef5f6c236d6d41b'),
                    text: 'This is the first paragraph of chapter 3. The story begins with our hero embarking on an unexpected journey that will change their life forever.\n\nAs they ventured deeper into the unknown, mysteries began to unfold. Each step brought new challenges and discoveries that tested their courage and determination.\n\nThe landscape transformed around them, revealing ancient secrets and hidden powers. What started as a simple quest was becoming something far greater than anyone could have imagined.\n\nWith newfound allies and growing wisdom, our hero pressed onward. The path ahead was uncertain, but their resolve had never been stronger.',
                    paragraphCount: 4,
                    voice: 'en-US',
                    voiceType: TTSVoiceType.NEUTRAL,
                    speed: 1,
                    pitch: 0,
                    volumeGainDb: 0,
                    language: 'en-US',
                    status: TTSStatus.COMPLETED,
                    playCount: 5,
                    characterCount: 632,
                    audioFormat: 'mp3',
                    audioUrl:
                        'https://res.cloudinary.com/dmcg6uu1f/video/upload/v1763976650/tts/whpisal3wj5rf0xagx0a.mp3',
                    processedAt: new Date('2025-11-24T09:30:53.657Z'),
                    provider: 'voicerss',
                    lastPlayedAt: new Date('2025-11-24T11:52:36.051Z'),
                },
                {
                    chapterId: new Types.ObjectId('69252d03e8c2a0862a4030d2'),
                    bookId: new Types.ObjectId('692526b09ab7db867e93e1af'),
                    text: 'Lời Nguyền Của Đóa Hoa Đêm\n\nGió rít qua kẽ lá cổ thụ, mang theo mùi ẩm lạnh của đất và sương. Elara ghì chặt chiếc áo choàng len, ánh mắt dán vào cánh cửa gỗ mục nát của Tháp Ký Ức—một công trình kiến trúc bị lãng quên, được đồn đại là nơi giam giữ linh hồn của những nhà giả kim đã thất bại.\n\nCô không đến đây vì vàng bạc, mà vì một truyền thuyết: Cứ mỗi đêm trăng tròn, một đóa Hắc Dạ Lam sẽ nở rộ bên trong tháp. Ai hái được đóa hoa đó sẽ nhận được một ký ức mạnh mẽ nhất từ những người đã khuất, đổi lại là một phần linh hồn của chính mình.\n\nElara bước qua ngưỡng cửa, và thế giới bên ngoài tan biến. Không gian bên trong tĩnh lặng đến đáng sợ, chỉ có tiếng nhịp tim cô đập thình thịch. Bụi bặm và mạng nhện giăng mắc khắp nơi, nhưng ở trung tâm căn phòng chính, trên một bệ đá nứt nẻ, là một điều không thể tin được: Đóa Hắc Dạ Lam.\n\nNó không phải màu xanh lam, mà là màu đen sâu thẳm, với những đường gân màu bạc lấp lánh như các chòm sao bị nuốt chửng. Ánh trăng từ một khe hở trên trần chiếu thẳng vào, làm đóa hoa phát ra một ánh sáng ma mị, mời gọi.\n\nKhi ngón tay Elara gần chạm vào cánh hoa, một tiếng thì thầm vang lên trong tâm trí cô, không phải bằng ngôn ngữ, mà bằng cảm xúc: Sự Hối Hận.\n\nĐúng lúc đó, hàng trăm chiếc bóng mờ ảo, run rẩy, hình thù con người, đột nhiên xuất hiện từ những bức tường. Chúng không có mắt, nhưng Elara cảm nhận được ánh nhìn lạnh lẽo, tuyệt vọng đang đổ dồn vào mình. Cô biết, đó là những linh hồn bị giam cầm.\n\nMột linh hồn trong số đó, cao lớn và run rẩy nhất, thò một bàn tay xương xẩu về phía đóa hoa, dường như muốn giữ lại thứ đã lấy đi sinh mạng họ.\n\nElara phải lựa chọn: Rút lui, hoặc chấp nhận rủi ro để chạm vào Lời Nguyền và đối mặt với sự thật đang chờ đợi trong ký ức kia.',
                    paragraphCount: 9,
                    voice: 'vi-VN',
                    voiceType: TTSVoiceType.NEUTRAL,
                    speed: 1,
                    pitch: 0,
                    volumeGainDb: 0,
                    language: 'vi-VN',
                    status: TTSStatus.COMPLETED,
                    playCount: 1,
                    characterCount: 1730,
                    audioFormat: 'mp3',
                    audioUrl:
                        'https://res.cloudinary.com/dmcg6uu1f/video/upload/v1764044220/tts/uea8ttythxaodfbvdmlb.mp3',
                    processedAt: new Date('2025-11-25T04:17:04.867Z'),
                    provider: 'voicerss',
                    lastPlayedAt: new Date('2025-11-25T04:17:33.692Z'),
                },
                {
                    chapterId: new Types.ObjectId('692526b09ab7db867e93e1ba'),
                    bookId: new Types.ObjectId('692526b09ab7db867e93e1af'),
                    text: 'This is the first paragraph of chapter 1. The story begins with our hero embarking on an unexpected journey that will change their life forever. This is the first paragraph of chapter 1. The story begins with our hero embarking on an unexpected journey that will change their life forever.\n\nAs they ventured deeper into the unknown, mysteries began to unfold. Each step brought new challenges and discoveries that tested their courage and determination.\n\nThe landscape transformed around them, revealing ancient secrets and hidden powers. What started as a simple quest was becoming something far greater than anyone could have imagined.\n\nWith newfound allies and growing wisdom, our hero pressed onward. The path ahead was uncertain, but their resolve had never been stronger.',
                    paragraphCount: 4,
                    voice: 'en-US',
                    voiceType: TTSVoiceType.NEUTRAL,
                    speed: 1,
                    pitch: 0,
                    volumeGainDb: 0,
                    language: 'en-US',
                    status: TTSStatus.COMPLETED,
                    playCount: 1,
                    characterCount: 777,
                    audioFormat: 'mp3',
                    audioUrl:
                        'https://res.cloudinary.com/dmcg6uu1f/video/upload/v1764061577/tts/uqgzlsvwnkr8qrrrxljf.mp3',
                    processedAt: new Date('2025-11-25T09:06:21.614Z'),
                    provider: 'voicerss',
                    lastPlayedAt: new Date('2025-11-25T09:08:13.914Z'),
                },
                {
                    chapterId: new Types.ObjectId('692526b09ab7db867e93e1bf'),
                    bookId: new Types.ObjectId('692526b09ab7db867e93e1af'),
                    text: 'This is the first paragraph of chapter 2. The story begins with our hero embarking on an unexpected journey that will change their life forever.\n\nAs they ventured deeper into the unknown, mysteries began to unfold. Each step brought new challenges and discoveries that tested their courage and determination.\n\nThe landscape transformed around them, revealing ancient secrets and hidden powers. What started as a simple quest was becoming something far greater than anyone could have imagined.\n\nWith newfound allies and growing wisdom, our hero pressed onward. The path ahead was uncertain, but their resolve had never been stronger.',
                    paragraphCount: 4,
                    voice: 'en-US',
                    voiceType: TTSVoiceType.NEUTRAL,
                    speed: 1,
                    pitch: 0,
                    volumeGainDb: 0,
                    language: 'en-US',
                    status: TTSStatus.COMPLETED,
                    playCount: 0,
                    characterCount: 632,
                    audioFormat: 'mp3',
                    audioUrl:
                        'https://res.cloudinary.com/dmcg6uu1f/video/upload/v1764061616/tts/ne5qlaywpehc8w30dxay.mp3',
                    processedAt: new Date('2025-11-25T09:06:59.146Z'),
                    provider: 'voicerss',
                },
                {
                    chapterId: new Types.ObjectId('692526b09ab7db867e93e1c4'),
                    bookId: new Types.ObjectId('692526b09ab7db867e93e1af'),
                    text: 'This is the first paragraph of chapter 3. The story begins with our hero embarking on an unexpected journey that will change their life forever.\n\nAs they ventured deeper into the unknown, mysteries began to unfold. Each step brought new challenges and discoveries that tested their courage and determination.\n\nThe landscape transformed around them, revealing ancient secrets and hidden powers. What started as a simple quest was becoming something far greater than anyone could have imagined.\n\nWith newfound allies and growing wisdom, our hero pressed onward. The path ahead was uncertain, but their resolve had never been stronger.',
                    paragraphCount: 4,
                    voice: 'en-US',
                    voiceType: TTSVoiceType.NEUTRAL,
                    speed: 1,
                    pitch: 0,
                    volumeGainDb: 0,
                    language: 'en-US',
                    status: TTSStatus.COMPLETED,
                    playCount: 0,
                    characterCount: 632,
                    audioFormat: 'mp3',
                    audioUrl:
                        'https://res.cloudinary.com/dmcg6uu1f/video/upload/v1764062707/tts/tdwv5lg8wgzroz41trt9.mp3',
                    processedAt: new Date('2025-11-25T09:25:11.029Z'),
                    provider: 'voicerss',
                },
                {
                    chapterId: new Types.ObjectId('692526b09ab7db867e93e1d3'),
                    bookId: new Types.ObjectId('692526b09ab7db867e93e1b0'),
                    text: 'In the halls of power, plots were being woven like intricate tapestries. Every word spoken carried weight, every glance held meaning.\n\nWhispers of betrayal echoed through the stone corridors. Trust was a rare commodity in this world where alliances shifted like sand in the wind.\n\nAs winter approached, the game of thrones intensified. Noble houses maneuvered for position, each seeking advantage over their rivals.',
                    paragraphCount: 3,
                    voice: 'en-US',
                    voiceType: TTSVoiceType.NEUTRAL,
                    speed: 1,
                    pitch: 0,
                    volumeGainDb: 0,
                    language: 'en-US',
                    status: TTSStatus.COMPLETED,
                    playCount: 0,
                    characterCount: 415,
                    audioFormat: 'mp3',
                    audioUrl:
                        'https://res.cloudinary.com/dmcg6uu1f/video/upload/v1764063028/tts/qmvd2rr8vgi31h1ils8z.mp3',
                    processedAt: new Date('2025-11-25T09:30:31.770Z'),
                    provider: 'voicerss',
                },
            ];

            await this.textToSpeechModel.insertMany(ttsData);
            this.logger.log(
                `✅ Successfully seeded ${ttsData.length} text-to-speech records`,
            );
        } catch (error) {
            this.logger.error('❌ Error seeding text-to-speech:', error);
            throw error;
        }
    }
}
