export interface ModerationResult {
    isSafe: boolean;
    isSpoiler: boolean;
    isToxic: boolean;
    reason?: string;
}
