const crypto = require("crypto");

const UPPERCASE = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWERCASE = "abcdefghijklmnopqrstuvwxyz";
const DIGITS = "0123456789";
const SPECIALS = "!@#$%^&*";

const pickRandom = (source) => {
  const index = crypto.randomInt(0, source.length);
  return source[index];
};

const shuffle = (arr) => {
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = crypto.randomInt(0, i + 1);
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
};

const getNamePrefix = (name = "") => {
  const cleaned = String(name)
    .replace(/[^a-zA-Z]/g, "")
    .toUpperCase();
  return (cleaned.slice(0, 4) || "USER").padEnd(4, "X");
};

const generateUserId = (name = "") => {
  const namePrefix = getNamePrefix(name);
  //   const timestampPart = Date.now().toString(36).toUpperCase();
  const randomPart = crypto.randomBytes(3).toString("hex").toUpperCase();
  return `${namePrefix}${randomPart}`;
};

const generatePassword = (length = 8) => {
  const normalizedLength = Math.max(length, 8);
  const required = [
    pickRandom(UPPERCASE),
    pickRandom(LOWERCASE),
    pickRandom(DIGITS),
    pickRandom(SPECIALS),
  ];

  const allChars = `${UPPERCASE}${LOWERCASE}${DIGITS}${SPECIALS}`;
  const remaining = Array.from(
    { length: normalizedLength - required.length },
    () => pickRandom(allChars),
  );

  return shuffle([...required, ...remaining]).join("");
};

const generateUserCredentials = (name = "") => {
  return {
    userID: generateUserId(name),
    password: generatePassword(),
  };
};

module.exports = {
  generateUserId,
  generatePassword,
  generateUserCredentials,
};
