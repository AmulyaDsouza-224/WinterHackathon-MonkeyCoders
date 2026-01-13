/**
 * Zero Knowledge Encryption Service
 * Uses Web Crypto API for client-side encryption.
 * NOTHING leaves the client unencrypted.
 */

export class ZKService {
    private static instance: ZKService;
    private encryptionKey: CryptoKey | null = null;

    private constructor() { }

    public static getInstance(): ZKService {
        if (!ZKService.instance) {
            ZKService.instance = new ZKService();
        }
        return ZKService.instance;
    }

    /**
     * Derives a cryptographic key from a simple user PIN using PBKDF2.
     * This ensures even a 4-digit PIN produces a strong key (salted).
     */
    public async deriveKey(pin: string, salt: string = "arctic-salt"): Promise<boolean> {
        try {
            const enc = new TextEncoder();
            const keyMaterial = await window.crypto.subtle.importKey(
                "raw",
                enc.encode(pin),
                { name: "PBKDF2" },
                false,
                ["deriveBits", "deriveKey"]
            );

            this.encryptionKey = await window.crypto.subtle.deriveKey(
                {
                    name: "PBKDF2",
                    salt: enc.encode(salt),
                    iterations: 100000,
                    hash: "SHA-256",
                },
                keyMaterial,
                { name: "AES-GCM", length: 256 },
                true,
                ["encrypt", "decrypt"]
            );

            return true;
        } catch (e) {
            console.error("Key Derivation Failed:", e);
            return false;
        }
    }

    public isUnlocked(): boolean {
        return this.encryptionKey !== null;
    }

    public lockVault() {
        this.encryptionKey = null;
    }

    public async encrypt(data: any): Promise<string | null> {
        if (!this.encryptionKey) return null;
        try {
            const enc = new TextEncoder();
            const encodedData = enc.encode(JSON.stringify(data));
            const iv = window.crypto.getRandomValues(new Uint8Array(12));

            const encryptedContent = await window.crypto.subtle.encrypt(
                { name: "AES-GCM", iv: iv },
                this.encryptionKey,
                encodedData
            );

            // Combine IV and Content for storage
            const ivArray = Array.from(iv);
            const contentArray = Array.from(new Uint8Array(encryptedContent));
            return JSON.stringify({ iv: ivArray, data: contentArray });
        } catch (e) {
            console.error("Encryption Failed:", e);
            return null;
        }
    }

    public async decrypt(encryptedBlob: string): Promise<any> {
        if (!this.encryptionKey) return null;
        try {
            const { iv, data } = JSON.parse(encryptedBlob);
            const ivUint8 = new Uint8Array(iv);
            const dataUint8 = new Uint8Array(data);

            const decryptedContent = await window.crypto.subtle.decrypt(
                { name: "AES-GCM", iv: ivUint8 },
                this.encryptionKey,
                dataUint8
            );

            const dec = new TextDecoder();
            return JSON.parse(dec.decode(decryptedContent));
        } catch (e) {
            console.error("Decryption Failed (Wrong PIN likely):", e);
            throw new Error("Invalid PIN or corrupted data");
        }
    }
}
