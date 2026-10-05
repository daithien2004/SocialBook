/**
 * Helper fake duy nhất cho test — xem .agents/skills/nestjs-type-safety-testing §10.
 *
 * Chỉ dùng cho class của framework/thứ ba (CommandBus, ExecutionContext, Socket,
 * ioredis…) không đáng bọc bằng port. Người gọi chỉ liệt kê member mà test dùng;
 * member khác không tồn tại và sẽ nổ nếu bị gọi — đó là hành vi mong muốn.
 *
 * File này là một trong hai chỗ được phép cast (xem backend/eslint.config.mjs).
 */
/**
 * @reason Dựng đối tượng giả cho class/framework bên thứ ba (CommandBus,
 * ExecutionContext, socket.io Socket, ioredis) mà không thể cài bằng port hẹp
 * trong phạm vi test; kiểm tra kiểu của fake không có giá trị vì mọi member
 * không được liệt kê đều cố ý vắng mặt. Mọi chỗ dùng phải liệt kê đúng member
 * mà test gọi.
 */
export const fakeOf = <T extends object>(
  impl: Partial<T> | Record<string, unknown>,
): T => impl as T;
