import * as crypto from "crypto";
import { config } from "../configs";

export class Crypto {
  private readonly algorithm = "aes-256-gcm";
  private readonly keyLength = 32;
  private readonly ivLength = 16;
  private readonly saltLength = 16;
  private readonly tagLength = 16;
  private readonly apiKeySalt: Buffer;

  constructor() {
    this.apiKeySalt = Buffer.from(config.security.encryptionKey, "hex");
  }

  async encrypt(data: string, key: string) {
    const iv = crypto.randomBytes(this.ivLength);
    const salt = crypto.randomBytes(this.saltLength);
    const derivedKey = await this.deriveKey(key, salt);
    const cipher = crypto.createCipheriv(this.algorithm, derivedKey, iv);
    const encrypted = Buffer.concat([
      cipher.update(data, "utf8"),
      cipher.final(),
    ]);
    const tag = cipher.getAuthTag();
    return Buffer.concat([salt, iv, tag, encrypted]).toString("base64");
  }

  async decrypt(encryptedData: string, key: string): Promise<string> {
    const data = Buffer.from(encryptedData, "base64");
    const salt = data.slice(0, this.saltLength);
    const iv = data.slice(this.saltLength, this.saltLength + this.ivLength);
    const tag = data.slice(
      this.saltLength + this.ivLength,
      this.saltLength + this.ivLength + this.tagLength,
    );
    const encrypted = data.slice(
      this.saltLength + this.ivLength + this.tagLength,
    );
    const derivedKey = await this.deriveKey(key, salt);
    const decipher = crypto.createDecipheriv(this.algorithm, derivedKey, iv);
    decipher.setAuthTag(tag);
    return decipher.update(encrypted) + decipher.final("utf8");
  }

  private async deriveKey(key: string, salt: Buffer): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      crypto.pbkdf2(
        key,
        salt,
        100000,
        this.keyLength,
        "sha512",
        (err, derivedKey) => {
          if (err) reject(err);
          else resolve(derivedKey);
        },
      );
    });
  }

  generateKeyPairs() {
    const keyPair = crypto.generateKeyPairSync("rsa", {
      modulusLength: 4096,
      publicKeyEncoding: {
        type: "spki",
        format: "pem",
      },
      privateKeyEncoding: {
        type: "pkcs8",
        format: "pem",
      },
    });
    return { publicKey: keyPair.publicKey, privateKey: keyPair.privateKey };
  }

  async hashApiKey(apiKey: string): Promise<string> {
    return new Promise((resolve, reject) => {
      crypto.scrypt(apiKey, this.apiKeySalt, 64, (err, derivedKey) => {
        if (err) reject(err);
        else resolve(derivedKey.toString("hex"));
      });
    });
  }

  generateApiKey(): string {
    return `ak_${crypto.randomBytes(32).toString("hex")}`;
  }
}
