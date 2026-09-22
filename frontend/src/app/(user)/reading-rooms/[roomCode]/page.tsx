import { ReadingRoomPageClient } from '@/features/reading-rooms/components/ReadingRoomPageClient';

export default async function ReadingRoomPage({ params }: { params: Promise<{ roomCode: string }> }) {
  const { roomCode } = await params;
  return <ReadingRoomPageClient roomCode={roomCode} />;
}
