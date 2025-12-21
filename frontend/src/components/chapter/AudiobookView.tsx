'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { Volume2, Play, Pause, SkipForward, SkipBack, Loader2 } from 'lucide-react';
import { useGetChapterAudioQuery, useIncrementPlayCountMutation } from '@/src/features/tts/api/ttsApi';

interface Paragraph {
    id: string;
    content: string;
}

interface AudiobookViewProps {
    chapterId: string;
    chapterTitle: string;
    paragraphs: Paragraph[];
    bookTitle?: string;
    bookCoverImage?: string;
}

export default function AudiobookView({
    chapterId,
    chapterTitle,
    paragraphs,
    bookTitle,
    bookCoverImage,
}: AudiobookViewProps) {
    const { data: ttsData, isLoading } = useGetChapterAudioQuery(chapterId);
    const [incrementPlayCount] = useIncrementPlayCountMutation();

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1);
    const [activeParagraphIndex, setActiveParagraphIndex] = useState<number>(-1);
    const [hasTrackedPlay, setHasTrackedPlay] = useState(false);

    const audioRef = useRef<HTMLAudioElement>(null);
    const paragraphRefs = useRef<(HTMLParagraphElement | null)[]>([]);

    // Add style to hide scrollbar globally for this component
    useEffect(() => {
        const style = document.createElement('style');
        style.innerHTML = `
            .audiobook-scroll::-webkit-scrollbar {
                display: none;
            }
        `;
        document.head.appendChild(style);
        return () => {
            document.head.removeChild(style);
        };
    }, []);

    // Calculate estimated start times for paragraphs
    const paragraphTimings = useMemo(() => {
        if (!duration || !paragraphs.length) return [];

        const totalChars = paragraphs.reduce((acc, p) => acc + p.content.length, 0);
        let accumulatedTime = 0;

        return paragraphs.map((p) => {
            const startTime = accumulatedTime;
            const durationShare = (p.content.length / totalChars) * duration;
            accumulatedTime += durationShare;
            return { startTime, endTime: accumulatedTime };
        });
    }, [duration, paragraphs]);

    // Sync active paragraph with audio time
    useEffect(() => {
        if (!paragraphTimings.length || !isPlaying) return;

        const index = paragraphTimings.findIndex(
            (t) => currentTime >= t.startTime && currentTime < t.endTime
        );

        if (index !== -1 && index !== activeParagraphIndex) {
            setActiveParagraphIndex(index);

            // Auto-scroll
            const element = paragraphRefs.current[index];
            if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            }
        }
    }, [currentTime, paragraphTimings, activeParagraphIndex, isPlaying]);

    // Audio event handlers
    const onLoadedMetadata = (e: React.SyntheticEvent<HTMLAudioElement>) => {
        const audio = e.currentTarget;
        if (audio.duration && !isNaN(audio.duration) && audio.duration !== Infinity) {
            setDuration(audio.duration);
        }
    };

    const onTimeUpdate = (e: React.SyntheticEvent<HTMLAudioElement>) => {
        setCurrentTime(e.currentTarget.currentTime);
    };

    const onEnded = () => {
        setIsPlaying(false);
        setActiveParagraphIndex(-1);
        setCurrentTime(0);
    };

    const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
        const time = parseFloat(e.target.value);
        if (audioRef.current) {
            audioRef.current.currentTime = time;
            setCurrentTime(time);
        }
    };

    const togglePlay = async () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
            setIsPlaying(false);
        } else {
            await audio.play();
            setIsPlaying(true);

            if (!hasTrackedPlay && ttsData?.chapterId) {
                incrementPlayCount(ttsData.chapterId);
                setHasTrackedPlay(true);
            }
        }
    };

    const skip = (seconds: number) => {
        const audio = audioRef.current;
        if (!audio) return;
        audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + seconds));
    };

    const changeSpeed = () => {
        const speeds = [0.75, 1, 1.25, 1.5, 2];
        const currentIndex = speeds.indexOf(playbackRate);
        const nextSpeed = speeds[(currentIndex + 1) % speeds.length];
        setPlaybackRate(nextSpeed);
        if (audioRef.current) {
            audioRef.current.playbackRate = nextSpeed;
        }
    };

    const formatTime = (time: number) => {
        if (isNaN(time)) return '0:00';
        const minutes = Math.floor(time / 60);
        const seconds = Math.floor(time % 60);
        return `${minutes}:${seconds.toString().padStart(2, '0')}`;
    };

    const handleParagraphClick = (index: number) => {
        const timing = paragraphTimings[index];
        if (timing && audioRef.current) {
            audioRef.current.currentTime = timing.startTime;
            if (!isPlaying) togglePlay();
            setActiveParagraphIndex(index);
        }
    };

    if (isLoading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-[#666666] bg-[#F9F6F0]">
                <Loader2 className="w-8 h-8 animate-spin mb-4 text-[#2D2D2D]" />
                <p>Đang tải audio...</p>
            </div>
        );
    }

    if (!ttsData || ttsData.status !== 'completed') {
        return (
            <div className="flex flex-col items-center justify-center h-full text-[#666666] bg-[#F9F6F0]">
                <div className="bg-[#EAE5DC]/50 p-8 rounded-2xl text-center max-w-md">
                    <Volume2 className="w-12 h-12 mx-auto mb-4 text-[#4A4A4A]" />
                    <h3 className="text-xl font-semibold text-[#2D2D2D] mb-2">Chưa có Audio</h3>
                    <p className="text-[#666666]">
                        Audio cho chương này chưa được tạo hoặc đang trong quá trình xử lý.
                        Vui lòng quay lại sau hoặc sử dụng chế độ đọc.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#F9F6F0] text-[#2D2D2D]" style={{ overflow: 'hidden' }}>
            {/* Main Content Area - Scrollable */}
            <div
                className="flex-1 overflow-y-auto px-4 py-8 md:px-8 lg:px-16 scroll-smooth audiobook-scroll"
                style={{
                    scrollbarWidth: 'none',
                    msOverflowStyle: 'none',
                }}
                onScroll={(e) => {
                    const target = e.target as HTMLDivElement;
                    target.style.setProperty('scrollbar-width', 'none');
                }}
            >
                <div className="max-w-3xl mx-auto space-y-8 pb-32">
                    {/* Header Info */}
                    <div className="text-center space-y-2 mb-12">
                        <h2 className="text-sm font-medium text-[#666666] tracking-wider uppercase">
                            {bookTitle}
                        </h2>
                        <h1 className="text-3xl md:text-4xl font-bold text-[#1A1A1A] leading-tight font-serif">
                            {chapterTitle}
                        </h1>
                    </div>

                    {/* Paragraphs */}
                    <div className="space-y-6">
                        {paragraphs.map((para, index) => (
                            <p
                                key={para.id}
                                ref={(el) => { paragraphRefs.current[index] = el; }}
                                onClick={() => handleParagraphClick(index)}
                                className={`
                                    text-lg md:text-xl leading-relaxed transition-all duration-500 cursor-pointer p-6 rounded-xl border-l-4 font-serif
                                    ${activeParagraphIndex === index
                                        ? 'bg-[#EAE5DC] text-[#1A1A1A] shadow-sm border-[#2D2D2D]'
                                        : 'border-transparent text-[#555555] hover:text-[#2D2D2D] hover:bg-[#EAE5DC]/30'}
                                `}
                            >
                                {para.content}
                            </p>
                        ))}
                    </div>
                </div>
            </div>

            {/* Fixed Player Control Bar */}
            <div className="h-auto py-6 bg-[#F9F6F0] border-t border-[#E5E0D8] px-4 md:px-8 flex flex-col gap-4 z-50 shrink-0 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
                <audio
                    ref={audioRef}
                    src={ttsData.audioUrl}
                    preload="metadata"
                    onLoadedMetadata={onLoadedMetadata}
                    onTimeUpdate={onTimeUpdate}
                    onEnded={onEnded}
                />

                {/* Progress Bar (Slider) */}
                {/* Progress Bar - Đã nâng cấp siêu đẹp */}
                <div className="w-full flex items-center gap-3">
                    <span className="text-xs font-mono text-[#666666] w-10 text-right">
                        {formatTime(currentTime)}
                    </span>

                    {/* Custom thanh tiến độ 2 màu */}
                    <div className="relative flex-1 h-2 group">
                        <div className="absolute inset-0 bg-[#E5E0D8] rounded-full" />
                        <div
                            className="absolute inset-0 bg-[#2D2D2D] rounded-full transition-all duration-300"
                            style={{ width: duration ? `${(currentTime / duration) * 100}%` : '0%' }}
                        />
                        <input
                            type="range"
                            min="0"
                            max={duration || 0}
                            step="0.1"
                            value={currentTime}
                            onChange={handleSeek}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div
                            className="absolute top-1/2 -translate-y-1/2 w-4 h-4 bg-[#2D2D2D] rounded-full shadow-lg opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"
                            style={{
                                left: duration ? `${(currentTime / duration) * 100}%` : '0%',
                                transform: 'translate(-50%, -50%)',
                            }}
                        />
                    </div>

                    <span className="text-xs font-mono text-[#666666] w-10">
                        {formatTime(duration)}
                    </span>
                </div>

                {/* Controls Row */}
                <div className="flex items-center justify-between mt-2">
                    {/* Empty left for balance */}
                    <div className="w-24"></div>

                    {/* Main Controls */}
                    <div className="flex items-center gap-6">
                        <button
                            onClick={() => skip(-10)}
                            className="p-2 text-[#666666] hover:text-[#1A1A1A] transition-colors"
                            title="Lùi 10s"
                        >
                            <SkipBack className="w-6 h-6" />
                        </button>

                        <button
                            onClick={togglePlay}
                            className="w-14 h-14 flex items-center justify-center bg-[#2D2D2D] text-[#F9F6F0] rounded-full hover:scale-105 transition-transform shadow-lg shadow-black/10"
                        >
                            {isPlaying ? (
                                <Pause className="w-6 h-6 fill-current" />
                            ) : (
                                <Play className="w-6 h-6 fill-current ml-1" />
                            )}
                        </button>

                        <button
                            onClick={() => skip(10)}
                            className="p-2 text-[#666666] hover:text-[#1A1A1A] transition-colors"
                            title="Tua 10s"
                        >
                            <SkipForward className="w-6 h-6" />
                        </button>

                        <button
                            onClick={changeSpeed}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-[#EAE5DC] text-xs font-medium text-[#2D2D2D] hover:bg-[#DCD6CC] transition-colors ml-2"
                            title="Tốc độ phát"
                        >
                            <span>{playbackRate}x</span>
                        </button>
                    </div>

                    {/* Right: Empty for balance */}
                    <div className="w-24"></div>
                </div>
            </div>
        </div>
    );
}