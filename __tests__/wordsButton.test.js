const path = require("node:path");
const { MessageFlags } = require("discord.js");
const { BrainApiError } = require(path.join(
  __dirname,
  "../src/utils/api.js"
));
const wordsButton = require(path.join(
  __dirname,
  "../src/handler/buttons/wordsButton.js"
));

const { respondWithApiError } = wordsButton.__internal;

describe("respondWithApiError", () => {
  test("prefers user message from error", async () => {
    const interaction = {
      deferred: false,
      replied: false,
      isRepliable: () => true,
      reply: jest.fn().mockResolvedValue(undefined),
      followUp: jest.fn(),
    };

    const error = new BrainApiError("boom", {
      userMessage: "Lesbare Meldung",
    });

    await respondWithApiError(interaction, error, "Fallback");

    expect(interaction.reply).toHaveBeenCalledWith({
      content: "Lesbare Meldung",
      flags: MessageFlags.Ephemeral,
    });
    expect(interaction.followUp).not.toHaveBeenCalled();
  });

  test("falls back to followUp when already replied", async () => {
    const interaction = {
      deferred: false,
      replied: true,
      isRepliable: () => true,
      reply: jest.fn(),
      followUp: jest.fn().mockResolvedValue(undefined),
    };

    await respondWithApiError(interaction, new Error("boom"), "Fallback");

    expect(interaction.followUp).toHaveBeenCalledWith({
      content: "Fallback",
      flags: MessageFlags.Ephemeral,
    });
  });
});
