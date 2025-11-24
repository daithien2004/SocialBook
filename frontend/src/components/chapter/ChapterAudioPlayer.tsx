'use client';

import { useState, useRef, useEffect } from 'react';
import { Volume2, Play, Pause, SkipForward, SkipBack, Loader2 } from 'lucide-react';
import { useGetChapterAudioQuery, useIncrementPlayCountMutation } from '@/src/features/tts/api/ttsApi';

interface ChapterAudioPlayerProps {
    chapterId: string;
    chapterTitle: string;
}

export default function ChapterAudioPlayer({ chapterId, chapterTitle }: ChapterAudioPlayerProps) {
    const { data: ttsData, isLoading } = useGetChapterAudioQuery(chapterId);
    const [incrementPlayCount] = useIncrementPlayCountMutation();

    const [isPlaying, setIsPlaying] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [playbackRate, setPlaybackRate] = useState(1);
    const audioRef = useRef<HTMLAudioElement>(null);
    const [hasTrackedPlay, setHasTrackedPlay] = useState(false);

    useEffect(() => {
        const audio = audioRef.current;
        if (!audio) return;
        console.log(11111111111111111111111111);
        const updateTime = () => setCurrentTime(audio.currentTime);
        const updateDuration = () => setDuration(audio.duration);
        const handleEnded = () => setIsPlaying(false);

        audio.addEventListener('timeupdate', updateTime);
        audio.addEventListener('loadedmetadata', updateDuration);
        audio.addEventListener('ended', handleEnded);

        return () => {
            audio.removeEventListener('timeupdate', updateTime);
            audio.removeEventListener('loadedmetadata', updateDuration);
            audio.removeEventListener('ended', handleEnded);
        };
    }, []);

    const togglePlay = async () => {
        const audio = audioRef.current;
        if (!audio) return;

        if (isPlaying) {
            audio.pause();
            setIsPlaying(false);
        } else {
            await audio.play();
            setIsPlaying(true);

            // Track play count only once per session
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

    const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
        const audio = audioRef.current;
        if (!audio) return;

        const rect = e.currentTarget.getBoundingClientRect();
        const percent = (e.clientX - rect.left) / rect.width;
        audio.currentTime = percent * audio.duration;
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

    // Don't show anything if loading or no audio
    if (isLoading) {
        return (
            <div className="w-full max-w-4xl mx-auto px-4 py-3">
                <div className="bg-gray-800/50 backdrop-blur-sm rounded-lg p-4 border border-gray-700">
                    <div className="flex items-center gap-3">
                        <Loader2 className="w-5 h-5 animate-spin text-blue-400" />
                        <span className="text-sm text-gray-400">Đang kiểm tra audio...</span>
                    </div>
                </div>
            </div>
        );
    }

    if (!ttsData || ttsData.status !== 'completed') {
        return null; // Don't show player if no audio available
    }

    const progress = duration > 0 ? (currentTime / duration) * 100 : 0;

    return (
        <div className="w-full max-w-4xl mx-auto px-4 py-3 sticky top-16 z-40">
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 backdrop-blur-sm rounded-lg p-4 border border-gray-700 shadow-2xl">
                {/* Hidden audio element */}
                <audio ref={audioRef} src={ttsData.audioUrl} preload="metadata" />

                {/* Header */}
                <div className="flex items-center gap-2 mb-3">
                    <Volume2 className="w-5 h-5 text-blue-400" />
                    <span className="text-sm font-medium text-gray-300">
                        Audio: {chapterTitle}
                    </span>
                </div>

                {/* Progress Bar */}
                <div
                    className="w-full h-2 bg-gray-700 rounded-full cursor-pointer mb-3 group"
                    onClick={handleProgressClick}
                >
                    <div
                        className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all group-hover:h-3"
                        style={{ width: `${progress}%` }}
                    />
                </div>

                {/* Controls */}
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        {/* Skip Back */}
                        <button
                            onClick={() => skip(-10)}
                            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                            title="Lùi 10s"
                        >
                            <SkipBack className="w-5 h-5 text-gray-300" />
                        </button>

                        {/* Play/Pause */}
                        <button
                            onClick={togglePlay}
                            className="p-3 bg-blue-600 hover:bg-blue-700 rounded-full transition-colors"
                            title={isPlaying ? 'Tạm dừng' : 'Phát'}
                        >
                            {isPlaying ? (
                                <Pause className="w-6 h-6 text-white" />
                            ) : (
                                <Play className="w-6 h-6 text-white" />
                            )}
                        </button>

                        {/* Skip Forward */}
                        <button
                            onClick={() => skip(10)}
                            className="p-2 hover:bg-gray-700 rounded-lg transition-colors"
                            title="Tua 10s"
                        >
                            <SkipForward className="w-5 h-5 text-gray-300" />
                        </button>

                        {/* Speed Control */}
                        <button
                            onClick={changeSpeed}
                            className="px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium text-gray-300 transition-colors"
                            title="Thay đổi tốc độ"
                        >
                            {playbackRate}x
                        </button>
                    </div>

                    {/* Time Display */}
                    <div className="text-sm text-gray-400 font-mono">
                        {formatTime(currentTime)} / {formatTime(duration)}
                    </div>
                </div>
            </div>
        </div>
    );
}
