import { IsString, MaxLength, MinLength } from "class-validator";
import {
  type SendMessageDto as SharedSendMessageDto,
  type AssertTrue,
  type TypesAreEqual,
} from "@driving-school-booking/shared-types";

const MAX_MESSAGE_LENGTH = 4000;

export class SendMessageDto {
  @IsString()
  @MinLength(1)
  @MaxLength(MAX_MESSAGE_LENGTH)
  body!: string;
}

type _assert = AssertTrue<TypesAreEqual<SendMessageDto, SharedSendMessageDto>>;
