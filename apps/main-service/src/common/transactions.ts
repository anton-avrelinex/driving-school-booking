import { Prisma } from "../generated/prisma/client";
import { PrismaService } from "../prisma/prisma.service";

type TxClient = Omit<
  Prisma.TransactionClient,
  "$connect" | "$disconnect" | "$on" | "$transaction" | "$use" | "$extends"
>;

const MAX_RETRIES = 3;
const BACKOFF_BASE_MS = 10;

export async function withSerializableRetry<T>(
  prisma: PrismaService,
  fn: (tx: TxClient) => Promise<T>,
): Promise<T> {
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      return await prisma.$transaction(fn, {
        isolationLevel: Prisma.TransactionIsolationLevel.Serializable,
      });
    } catch (err) {
      const isSerializationFailure =
        err instanceof Prisma.PrismaClientKnownRequestError &&
        err.code === "P2034";
      if (!isSerializationFailure || attempt >= MAX_RETRIES) {
        throw err;
      }
      await new Promise((r) => setTimeout(r, BACKOFF_BASE_MS * (attempt + 1)));
    }
  }
  throw new Error("unreachable");
}
