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
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <Loader2 className="w-8 h-8 animate-spin mb-4 text-blue-500" />
                <p>Đang tải audio...</p>
            </div>
        );
    }

    if (!ttsData || ttsData.status !== 'completed') {
        return (
            <div className="flex flex-col items-center justify-center h-full text-slate-400">
                <div className="bg-slate-800/50 p-8 rounded-2xl text-center max-w-md">
                    <Volume2 className="w-12 h-12 mx-auto mb-4 text-slate-600" />
                    <h3 className="text-xl font-semibold text-slate-200 mb-2">Chưa có Audio</h3>
                    <p className="text-slate-400">
                        Audio cho chương này chưa được tạo hoặc đang trong quá trình xử lý.
                        Vui lòng quay lại sau hoặc sử dụng chế độ đọc.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#1a1a1a] text-[#e5e5e5]" style={{ overflow: 'hidden' }}>
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
                        <h2 className="text-sm font-medium text-blue-400 tracking-wider uppercase">
                            {bookTitle}
                        </h2>
                        <h1 className="text-3xl md:text-4xl font-bold text-white leading-tight">
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
                                    text-lg md:text-xl leading-relaxed transition-all duration-500 cursor-pointer p-4 rounded-xl border-l-4
                                    ${activeParagraphIndex === index
                                        ? 'bg-slate-800/80 text-white shadow-lg scale-[1.02] border-blue-500'
                                        : 'border-transparent text-slate-400 hover:text-slate-300 hover:bg-slate-800/30'}
                                `}
                            >
                                {para.content}
                            </p>
                        ))}
                    </div>
                </div>
            </div>

            {/* Fixed Player Control Bar */}
            <div className="h-auto py-4 bg-[#0f0f0f] border-t border-slate-800 px-4 md:px-8 flex flex-col gap-2 z-50 shrink-0">
                <audio
                    ref={audioRef}
                    src={ttsData.audioUrl}
                    preload="metadata"
                    onLoadedMetadata={onLoadedMetadata}
                    onTimeUpdate={onTimeUpdate}
                    onEnded={onEnded}
                />

                {/* Progress Bar (Slider) */}
                <div className="w-full flex items-center gap-3">
                    <span className="text-xs font-mono text-slate-500 w-10 text-right">
                        {formatTime(currentTime)}
                    </span>
                    <input
                        type="range"
                        min={0}
                        max={duration || 0}
                        value={currentTime}
                        onChange={handleSeek}
                        className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 hover:accent-blue-400 transition-all"
                    />
                    <span className="text-xs font-mono text-slate-500 w-10">
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
                            className="p-2 text-slate-400 hover:text-white transition-colors"
                            title="Lùi 10s"
                        >
                            <SkipBack className="w-6 h-6" />
                        </button>

                        <button
                            onClick={togglePlay}
                            className="w-12 h-12 flex items-center justify-center bg-white rounded-full hover:scale-105 transition-transform shadow-lg shadow-white/10"
                        >
                            {isPlaying ? (
                                <Pause className="w-5 h-5 text-black fill-current" />
                            ) : (
                                <Play className="w-5 h-5 text-black fill-current ml-1" />
                            )}
                        </button>

                        <button
                            onClick={() => skip(10)}
                            className="p-2 text-slate-400 hover:text-white transition-colors"
                            title="Tua 10s"
                        >
                            <SkipForward className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Right: Speed Control */}
                    <div className="w-24 flex justify-end">
                        <button
                            onClick={changeSpeed}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-800 text-xs font-medium text-slate-300 hover:bg-slate-700 transition-colors"
                        >
                            <span>{playbackRate}x</span>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}