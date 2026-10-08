import { Prisma } from "@prisma/client";
import { IGenericErrorResponse } from "../interfaces/common";
import parsePrismaValidationError from "./parsePrismaValidationError";

const handleValidationError = (
  error: Prisma.PrismaClientValidationError
): IGenericErrorResponse => {
  // Use the parser to extract clean, human-readable messages from the raw Prisma error text
  const parsed = parsePrismaValidationError(error.message);

  // Build a clean message: use the parsed output if available, otherwise a generic fallback
  const cleanMessage = parsed
    ? parsed
    : "One or more fields have invalid values. Please check your input.";

  // Also split into individual errorMessages for structured API response
  const errors: { path: string; message: string }[] = [];

  // Extract missing field errors individually
  const missingRegex = /Argument `(.+?)` is missing\./g;
  let match;
  while ((match = missingRegex.exec(error.message)) !== null) {
    errors.push({ path: match[1], message: `"${match[1]}" is required.` });
  }

  // Extract invalid value errors individually
  const invalidRegex =
    /Argument `(.+?)`: Invalid value provided\. Expected (.+?), provided (.+?)\./g;
  while ((match = invalidRegex.exec(error.message)) !== null) {
    errors.push({
      path: match[1],
      message: `"${match[1]}" must be a ${match[2]} (received ${match[3]}).`,
    });
  }

  // Fallback if regex found nothing
  if (errors.length === 0) {
    errors.push({ path: "", message: cleanMessage });
  }

  const statusCode = 400;
  return {
    statusCode,
    message: cleanMessage,
    errorMessages: errors,
  };
};

export default handleValidationError;
