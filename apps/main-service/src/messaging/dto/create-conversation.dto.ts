import { IsUUID } from "class-validator";
import {
  type CreateConversationDto as SharedCreateConversationDto,
  type AssertTrue,
  type TypesAreEqual,
} from "@driving-school-booking/shared-types";

export class CreateConversationDto {
  @IsUUID()
  otherUserId!: string;
}

type _assert = AssertTrue<
  TypesAreEqual<CreateConversationDto, SharedCreateConversationDto>
>;
