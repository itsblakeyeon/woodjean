import { customAlphabet } from "nanoid";

const alphabet = "0123456789ABCDEFGHJKMNPQRSTVWXYZabcdefghjkmnpqrstvwxyz";
const generate = customAlphabet(alphabet, 16);

export function newOrderId(): string {
  return `ord_${generate()}`;
}
