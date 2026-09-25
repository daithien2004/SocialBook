export class ProfileResponseDto {
  id: string;
  email: string;
  role: string;
}

export class MeResponseDto {
  id: string;
  email: string;
  role: string;
  username: string;
  image?: string;
}
